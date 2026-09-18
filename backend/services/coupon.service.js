const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const { round2 } = require('./pricing.service');

/**
 * Server-authoritative coupon evaluation. The frontend only ever sends a
 * `code`; every rule (window, usage caps, min order value, product/category
 * scoping) is re-checked here against live data before any discount is
 * applied to a cart or an order.
 */
async function evaluateCoupon(code, { userId, subtotal, productIds = [], categoryIds = [] }) {
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
  if (!coupon || !coupon.isActive) return { valid: false, reason: 'Coupon not found or inactive' };

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) return { valid: false, reason: 'Coupon is not active yet' };
  if (coupon.expiresAt && now > coupon.expiresAt) return { valid: false, reason: 'Coupon has expired' };

  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    return { valid: false, reason: `Minimum order value is ${coupon.minOrderValue}` };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit reached' };
  }

  if (coupon.perUserLimit && userId) {
    const timesUsed = await Order.countDocuments({ user: userId, couponCode: coupon.code });
    if (timesUsed >= coupon.perUserLimit) {
      return { valid: false, reason: 'You have already used this coupon' };
    }
  }

  if (coupon.applicableProducts?.length) {
    const applicable = productIds.some((id) => coupon.applicableProducts.some((p) => String(p) === String(id)));
    if (!applicable) return { valid: false, reason: 'Coupon does not apply to items in your cart' };
  }

  if (coupon.applicableCategories?.length) {
    const applicable = categoryIds.some((id) => coupon.applicableCategories.some((c) => String(c) === String(id)));
    if (!applicable) return { valid: false, reason: 'Coupon does not apply to items in your cart' };
  }

  let discountAmount = 0;
  let freeShipping = false;

  if (coupon.type === 'percentage') {
    discountAmount = subtotal * (coupon.value / 100);
  } else if (coupon.type === 'fixed') {
    discountAmount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === 'free_shipping') {
    freeShipping = true;
  }

  if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);

  return { valid: true, coupon, discountAmount: round2(discountAmount), freeShipping };
}

module.exports = { evaluateCoupon };
