const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Address = require('../models/Address');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const generateOrderNumber = require('../utils/orderNumber');
const { applyDiscount, round2 } = require('./pricing.service');
const { assertStockAvailable, decrementStock, restockLines } = require('./stock.service');
const { evaluateCoupon } = require('./coupon.service');
const { SUPPORTED_PAYMENT_METHODS } = require('../utils/paymentMethods');
const env = require('../config/env');

/**
 * Shipping fee policy.
 *
 * ASSUMPTION / BACKEND GAP: the backend brief does not specify an exact
 * shipping-fee calculation (flat rate vs per-seller vs weight/zone based).
 * Until that rule is confirmed, this uses a simple flat fee with a
 * free-shipping threshold, both overridable via env vars (config/env.js),
 * and is isolated here so it is a one-line change once the real policy is known.
 */
function computeShippingFee(subtotal, freeShippingFromCoupon) {
  if (freeShippingFromCoupon) return 0;
  if (subtotal >= env.freeShippingThreshold) return 0;
  return env.flatShippingFee;
}

/**
 * The single authoritative checkout path (backend brief §11 Order Integrity).
 * Re-reads cart/product/variant/coupon state fresh from MongoDB inside a
 * transaction, recomputes every price and the stock check, and only then
 * writes the Order + decrements inventory + clears the cart. The frontend
 * supplies ONLY the shipping destination and payment method — never a price.
 */
async function createOrderFromCart(userId, { addressId, shippingAddress, paymentMethod, notes }) {
  if (!SUPPORTED_PAYMENT_METHODS.includes(paymentMethod)) {
    throw ApiError.badRequest(`Unsupported payment method: ${paymentMethod}`);
  }

  const session = await mongoose.startSession();
  try {
    let order;
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: userId }).session(session);
      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest('Your cart is empty');
      }

      // ---- Resolve shipping address snapshot ------------------------------
      let addressSnapshot;
      if (addressId) {
        const address = await Address.findOne({ _id: addressId, user: userId }).session(session);
        if (!address) throw ApiError.badRequest('Selected address was not found on your account');
        addressSnapshot = {
          firstName: address.firstName, lastName: address.lastName, phone: address.phone,
          country: address.country, city: address.city, area: address.area, street: address.street,
          building: address.building, floor: address.floor, apartment: address.apartment, notes: address.notes
        };
      } else if (shippingAddress) {
        const required = ['firstName', 'lastName', 'phone', 'country', 'city', 'area', 'street'];
        for (const field of required) {
          if (!shippingAddress[field]) throw ApiError.badRequest(`shippingAddress.${field} is required`);
        }
        addressSnapshot = shippingAddress;
      } else {
        throw ApiError.badRequest('Provide either addressId or shippingAddress');
      }

      // ---- Re-read products/variants fresh, build authoritative line items -
      const lines = [];
      const stockCheckLines = [];
      let subtotal = 0;
      const productIds = new Set();
      const categoryIds = new Set();

      for (const item of cart.items) {
        const variant = await ProductVariant.findById(item.variant).session(session);
        if (!variant || !variant.isActive) {
          throw ApiError.conflict('One of your cart items is no longer available');
        }
        const product = await Product.findById(variant.product).session(session);
        if (!product || !product.isActive) {
          throw ApiError.conflict('One of your cart items is no longer available');
        }

        const unitPrice = applyDiscount(variant.price, product.discountType, product.discountValue);
        const lineTotal = round2(unitPrice * item.quantity);
        subtotal = round2(subtotal + lineTotal);

        productIds.add(String(product._id));
        categoryIds.add(String(product.category));
        stockCheckLines.push({ variantId: variant._id, quantity: item.quantity });

        lines.push({
          product: product._id,
          variant: variant._id,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          sku: variant.sku,
          seller: product.seller,
          unitPrice,
          quantity: item.quantity,
          lineTotal
        });
      }

      // ---- Stock — last authoritative check before committing -------------
      await assertStockAvailable(stockCheckLines, session);

      // ---- Coupon (server recalculates the discount; never trusts the cart's stored amount) --
      let discountTotal = 0;
      let couponCode = null;
      let couponDoc = null;
      let freeShippingFromCoupon = false;

      if (cart.coupon) {
        const coupon = await Coupon.findById(cart.coupon).session(session);
        if (coupon) {
          const evaluation = await evaluateCoupon(coupon.code, {
            userId, subtotal, productIds: [...productIds], categoryIds: [...categoryIds]
          });
          if (evaluation.valid) {
            discountTotal = evaluation.discountAmount;
            couponCode = coupon.code;
            couponDoc = coupon;
            freeShippingFromCoupon = evaluation.freeShipping;
          }
          // If the coupon became invalid between cart-time and checkout-time,
          // it is silently dropped rather than blocking checkout.
        }
      }

      const shippingFee = computeShippingFee(subtotal, freeShippingFromCoupon);
      const total = round2(Math.max(0, subtotal - discountTotal) + shippingFee);

      // ---- Persist ----------------------------------------------------------
      const [createdOrder] = await Order.create(
        [{
          orderNumber: generateOrderNumber(),
          user: userId,
          items: lines,
          subtotal,
          discountTotal,
          shippingFee,
          total,
          currency: 'EGP',
          couponCode,
          paymentMethod,
          paymentStatus: 'pending',
          orderStatus: 'pending',
          shippingAddress: addressSnapshot,
          notes: notes || undefined
        }],
        { session }
      );

      await decrementStock(stockCheckLines, session);

if (couponDoc) {
  const usageFilter = {
    _id: couponDoc._id,
    isActive: true,
  };

  // usageLimit = 0 or missing means unlimited.
  if (couponDoc.usageLimit > 0) {
    usageFilter.usedCount = {
      $lt: couponDoc.usageLimit,
    };
  }

  const updatedCoupon = await Coupon.findOneAndUpdate(
    usageFilter,
    {
      $inc: {
        usedCount: 1,
      },
    },
    {
      session,
      new: true,
    },
  );

  if (!updatedCoupon) {
    throw ApiError.badRequest("Coupon usage limit has been reached");
  }
}

      cart.items = [];
      cart.coupon = null;
      await cart.save({ session });

      order = createdOrder;
    });

    return order;
  } finally {
    session.endSession();
  }
}

/** Restores stock for a cancelled order. Wrapped in its own transaction for the same atomicity guarantee. */
async function restockOrder(order) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const lines = order.items.map((item) => ({ variantId: item.variant, quantity: item.quantity }));
      await restockLines(lines, session);
    });
  } finally {
    session.endSession();
  }
}

module.exports = { createOrderFromCart, restockOrder };
