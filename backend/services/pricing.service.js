/**
 * Single place that turns (basePrice/variant price, discountType, discountValue)
 * into an effective price. Both Product-level display discounts and any
 * per-request calculations should go through this so the rule never drifts
 * between controllers.
 */
function applyDiscount(price, discountType, discountValue) {
  if (!discountType || discountType === 'none' || !discountValue) return round2(price);
  if (discountType === 'percentage') return round2(price * (1 - discountValue / 100));
  if (discountType === 'fixed') return round2(Math.max(0, price - discountValue));
  return round2(price);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

module.exports = { applyDiscount, round2 };
