const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const Inventory = require('../models/Inventory');
const ProductVariant = require('../models/ProductVariant');

async function serializeWishlist(wishlist) {
  const items = [];
  for (const item of wishlist.items) {
    const product = await Product.findById(item.product);
    if (!product) continue;
    const primaryImage = await ProductImage.findOne({ product: product._id, isPrimary: true });

    let stockState = 'out_of_stock';
    let price = product.basePrice;
    if (item.variant) {
      const variant = await ProductVariant.findById(item.variant);
      if (variant) {
        price = variant.price;
        const inv = await Inventory.findOne({ variant: variant._id });
        stockState = inv ? inv.status : 'out_of_stock';
      }
    }

    items.push({
      _id: item._id,
      product: product._id,
      variant: item.variant,
      productNameAr: product.nameAr,
      productNameEn: product.nameEn,
      imageUrl: primaryImage?.url,
      price,
      stockState
    });
  }
  return { _id: wishlist._id, user: wishlist.user, items };
}

async function getOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, items: [] });
  return wishlist;
}

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  sendSuccess(res, { data: await serializeWishlist(wishlist) });
});

// POST /api/wishlist/items
const addItem = asyncHandler(async (req, res) => {
  const { product: productId, variant } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');

  const wishlist = await getOrCreateWishlist(req.user._id);
  const exists = wishlist.items.some((i) => String(i.product) === String(productId) && String(i.variant || '') === String(variant || ''));
  if (!exists) wishlist.items.push({ product: productId, variant: variant || null });

  await wishlist.save();
  sendSuccess(res, { statusCode: 201, data: await serializeWishlist(wishlist), message: 'Added to wishlist' });
});

// DELETE /api/wishlist/items/:itemId
const removeItem = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  const item = wishlist.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Wishlist item not found');

  item.deleteOne();
  await wishlist.save();
  sendSuccess(res, { data: await serializeWishlist(wishlist), message: 'Removed from wishlist' });
});

// DELETE /api/wishlist
const clear = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  wishlist.items = [];
  await wishlist.save();
  sendSuccess(res, { data: await serializeWishlist(wishlist), message: 'Wishlist cleared' });
});

module.exports = { getWishlist, addItem, removeItem, clear };
