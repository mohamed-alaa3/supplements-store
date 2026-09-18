const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

const Cart = require("../models/Cart");
const ProductVariant = require("../models/ProductVariant");
const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage");
const Inventory = require("../models/Inventory");
const Coupon = require("../models/Coupon");

const { applyDiscount, round2 } = require("../services/pricing.service");
const { evaluateCoupon } = require("../services/coupon.service");

const MAX_CART_ITEM_QUANTITY = 20;

/**
 * Returns the currently available quantity for a variant.
 *
 * If inventory tracking is disabled, the item is treated as having
 * unlimited availability from the cart's perspective.
 */
async function getAvailableStock(variantId) {
  const inventory = await Inventory.findOne({ variant: variantId });

  if (!inventory) {
    return {
      inventory: null,
      available: 0,
      trackInventory: true,
    };
  }

  if (!inventory.trackInventory) {
    return {
      inventory,
      available: Infinity,
      trackInventory: false,
    };
  }

  return {
    inventory,
    available: Math.max(
      0,
      inventory.stockQuantity - inventory.reservedQuantity,
    ),
    trackInventory: true,
  };
}

/**
 * Validates that a requested quantity is allowed for the variant.
 */
async function validateCartQuantity(variantId, quantity) {
  if (!Number.isInteger(quantity)) {
    throw ApiError.badRequest("Quantity must be an integer");
  }

  if (quantity < 1 || quantity > MAX_CART_ITEM_QUANTITY) {
    throw ApiError.badRequest(
      `Quantity must be between 1 and ${MAX_CART_ITEM_QUANTITY}`,
    );
  }

  const { inventory, available, trackInventory } =
    await getAvailableStock(variantId);

  if (!inventory && trackInventory) {
    throw ApiError.badRequest("Inventory record not found");
  }

  if (trackInventory && quantity > available) {
    if (available <= 0) {
      throw ApiError.badRequest("Item is out of stock");
    }

    throw ApiError.badRequest(
      `Only ${available} item${available === 1 ? "" : "s"} available`,
    );
  }

  if (inventory?.status === "disabled" && inventory.trackInventory) {
    throw ApiError.badRequest("Item is currently unavailable");
  }

  return {
    inventory,
    available,
    trackInventory,
  };
}

/**
 * Builds the denormalized Cart shape expected by the frontend.
 *
 * Prices and inventory information are always read from the database.
 * Cart totals are never trusted from the client.
 */
async function serializeCart(cart) {
  const items = [];

  let subtotal = 0;

  const productIds = [];
  const categoryIds = [];

  for (const item of cart.items) {
    const variant = await ProductVariant.findById(item.variant);

    if (!variant || !variant.isActive) {
      continue;
    }

    const product = await Product.findById(variant.product);

    if (!product) {
      continue;
    }

    const inventory = await Inventory.findOne({
      variant: variant._id,
    });

    const primaryImage = await ProductImage.findOne({
      product: product._id,
      isPrimary: true,
    });

    const unitPrice = applyDiscount(
      variant.price,
      product.discountType,
      product.discountValue,
    );

    const lineTotal = round2(unitPrice * item.quantity);

    subtotal = round2(subtotal + lineTotal);

    productIds.push(String(product._id));

    if (product.category) {
      categoryIds.push(String(product.category));
    }

let stockState = "out_of_stock";

if (!inventory) {
  stockState = "out_of_stock";
} else if (!inventory.trackInventory) {
  // Inventory tracking is disabled, so the item is considered available.
  stockState = "in_stock";
} else {
  const available = inventory.stockQuantity - inventory.reservedQuantity;

  if (available <= 0) {
    stockState = "out_of_stock";
  } else if (available <= inventory.lowStockThreshold) {
    stockState = "low_stock";
  } else {
    stockState = "in_stock";
  }
}

    items.push({
      _id: item._id,
      variant: variant._id,
      productId: product._id,

      productNameAr: product.nameAr,
      productNameEn: product.nameEn,

      variantLabel: [variant.flavor, variant.sizeLabel]
        .filter(Boolean)
        .join(" · "),

      imageUrl: primaryImage?.url,

      unitPrice,
      quantity: item.quantity,
      lineTotal,

      stockState,
    });
  }

  let discountTotal = 0;
  let couponCode = null;
  let freeShipping = false;

  if (cart.coupon) {
    const coupon = await Coupon.findById(cart.coupon);

    if (coupon) {
      const evaluation = await evaluateCoupon(coupon.code, {
        userId: cart.user,
        subtotal,
        productIds,
        categoryIds,
      });

      if (evaluation.valid) {
        discountTotal = evaluation.discountAmount;
        couponCode = coupon.code;
        freeShipping = evaluation.freeShipping;
      }
    }
  }

  return {
    _id: cart._id,
    user: cart.user,

    items,

    coupon: cart.coupon,
    couponCode,
    freeShipping,

    subtotal,
    discountTotal,

    total: round2(Math.max(0, subtotal - discountTotal)),
  };
}

/**
 * Gets the user's cart or creates one if it does not exist.
 */
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({
    user: userId,
  });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  return cart;
}

/**
 * GET /api/cart
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  sendSuccess(res, {
    data: await serializeCart(cart),
  });
});

/**
 * POST /api/cart/items
 */
const addItem = asyncHandler(async (req, res) => {
  const { variant: variantId, quantity } = req.body;

  const variant = await ProductVariant.findById(variantId);

  if (!variant || !variant.isActive) {
    throw ApiError.notFound("Variant not found");
  }

  const product = await Product.findById(variant.product);

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const cart = await getOrCreateCart(req.user._id);

  const existing = cart.items.find(
    (item) => String(item.variant) === String(variantId),
  );

  const requestedQuantity = existing ? existing.quantity + quantity : quantity;

  if (requestedQuantity > MAX_CART_ITEM_QUANTITY) {
    throw ApiError.badRequest(
      `Maximum quantity per item is ${MAX_CART_ITEM_QUANTITY}`,
    );
  }

  await validateCartQuantity(variantId, requestedQuantity);

  if (existing) {
    existing.quantity = requestedQuantity;
  } else {
    cart.items.push({
      variant: variantId,
      quantity,
    });
  }

  await cart.save();

  sendSuccess(res, {
    statusCode: 201,
    data: await serializeCart(cart),
    message: "Item added to cart",
  });
});

/**
 * PATCH /api/cart/items/:itemId
 */
const updateItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  const item = cart.items.id(req.params.itemId);

  if (!item) {
    throw ApiError.notFound("Cart item not found");
  }

  const quantity = req.body.quantity;

  await validateCartQuantity(item.variant, quantity);

  item.quantity = quantity;

  await cart.save();

  sendSuccess(res, {
    data: await serializeCart(cart),
    message: "Cart item updated",
  });
});

/**
 * DELETE /api/cart/items/:itemId
 */
const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  const item = cart.items.id(req.params.itemId);

  if (!item) {
    throw ApiError.notFound("Cart item not found");
  }

  item.deleteOne();

  await cart.save();

  sendSuccess(res, {
    data: await serializeCart(cart),
    message: "Item removed",
  });
});

/**
 * DELETE /api/cart
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  cart.items = [];
  cart.coupon = null;

  await cart.save();

  sendSuccess(res, {
    data: await serializeCart(cart),
    message: "Cart cleared",
  });
});

/**
 * POST /api/cart/apply-coupon
 */
const applyCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || "")
    .toUpperCase()
    .trim();

  if (!code) {
    throw ApiError.badRequest("Coupon code is required");
  }

  const cart = await getOrCreateCart(req.user._id);

  /*
   * Serialize without relying on an existing coupon.
   * This gives us the current subtotal, products and categories.
   */
  const partial = await serializeCart({
    ...cart.toObject(),
    coupon: null,
  });

  const evaluation = await evaluateCoupon(code, {
    userId: req.user._id,
    subtotal: partial.subtotal,
    productIds: partial.items.map((item) => String(item.productId)),
    categoryIds: partial.items.map((item) => String(item.productId)).length
      ? await getCartCategoryIds(cart)
      : [],
  });

  if (!evaluation.valid) {
    throw ApiError.badRequest(evaluation.reason || "Coupon is not valid");
  }

  const coupon = evaluation.coupon;

  cart.coupon = coupon._id;

  await cart.save();

  sendSuccess(res, {
    data: await serializeCart(cart),
    message: "Coupon applied",
  });
});

/**
 * Returns category IDs for products currently in the cart.
 */
async function getCartCategoryIds(cart) {
  const categoryIds = [];

  for (const item of cart.items) {
    const variant = await ProductVariant.findById(item.variant);

    if (!variant || !variant.isActive) {
      continue;
    }

    const product = await Product.findById(variant.product);

    if (!product || !product.category) {
      continue;
    }

    categoryIds.push(String(product.category));
  }

  return [...new Set(categoryIds)];
}

/**
 * DELETE /api/cart/coupon
 */
const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  cart.coupon = null;

  await cart.save();

  sendSuccess(res, {
    data: await serializeCart(cart),
    message: "Coupon removed",
  });
});

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  serializeCart,
  getOrCreateCart,
};
