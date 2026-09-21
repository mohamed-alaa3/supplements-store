const mongoose = require('mongoose');
const { pick, pickMany, randomInt, daysFromNow } = require('../rng');

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Mirrors services/pricing.service.js#applyDiscount exactly.
function applyDiscount(price, discountType, discountValue) {
  if (!discountType || discountType === 'none' || !discountValue) return round2(price);
  if (discountType === 'percentage') return round2(price * (1 - discountValue / 100));
  if (discountType === 'fixed') return round2(Math.max(0, price - discountValue));
  return round2(price);
}

// Mirrors services/checkout.service.js#computeShippingFee with the .env defaults
// (FLAT_SHIPPING_FEE=50, FREE_SHIPPING_THRESHOLD=1500).
function computeShippingFee(subtotal, freeShipping) {
  if (freeShipping) return 0;
  if (subtotal >= 1500) return 0;
  return 50;
}

function orderNumber(offsetDays) {
  const date = daysFromNow(offsetDays).toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SUP-${date}-${random}`;
}

const STATUS_PLAN = [
  { status: 'pending', paymentStatus: 'pending', daysAgo: 1 },
  { status: 'pending', paymentStatus: 'pending', daysAgo: 2 },
  { status: 'confirmed', paymentStatus: 'pending', daysAgo: 3 },
  { status: 'confirmed', paymentStatus: 'pending', daysAgo: 4 },
  { status: 'processing', paymentStatus: 'pending', daysAgo: 5 },
  { status: 'processing', paymentStatus: 'pending', daysAgo: 6 },
  { status: 'shipped', paymentStatus: 'pending', daysAgo: 8 },
  { status: 'shipped', paymentStatus: 'pending', daysAgo: 9 },
  { status: 'delivered', paymentStatus: 'paid', daysAgo: 12 },
  { status: 'delivered', paymentStatus: 'paid', daysAgo: 15 },
  { status: 'delivered', paymentStatus: 'paid', daysAgo: 18 },
  { status: 'delivered', paymentStatus: 'paid', daysAgo: 22 },
  { status: 'delivered', paymentStatus: 'paid', daysAgo: 27 },
  { status: 'delivered', paymentStatus: 'paid', daysAgo: 33 },
  { status: 'cancelled', paymentStatus: 'failed', daysAgo: 10 },
  { status: 'cancelled', paymentStatus: 'failed', daysAgo: 20 },
  { status: 'returned', paymentStatus: 'refunded', daysAgo: 25 }
];

const CANCEL_REASONS = ['Customer changed their mind', 'Found a better price elsewhere', 'Ordered by mistake'];

/**
 * Builds Order documents whose totals are derived the exact same way
 * services/checkout.service.js derives them at real checkout time, so a
 * seeded order is indistinguishable from one placed through the API.
 */
function generateOrders({ products, variants, customers, addresses, coupons }) {
  const productById = new Map(products.map((p) => [String(p._id), p]));
  const orders = [];
  const couponUsage = new Map(); // couponId -> times used, so we can bump usedCount afterward

  STATUS_PLAN.forEach((plan, index) => {
    const customer = pick(customers);
    const customerAddresses = addresses.filter((a) => String(a.user) === String(customer._id));
    const address = customerAddresses.length ? pick(customerAddresses) : null;

    const itemCount = randomInt(1, 4);
    const chosenVariants = pickMany(variants, itemCount);

    let subtotal = 0;
    const items = chosenVariants.map((variant) => {
      const product = productById.get(String(variant.product));
      const quantity = randomInt(1, 2);
      const unitPrice = applyDiscount(variant.price, product.discountType, product.discountValue);
      const lineTotal = round2(unitPrice * quantity);
      subtotal = round2(subtotal + lineTotal);

      return {
        product: product._id,
        variant: variant._id,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        sku: variant.sku,
        seller: product.seller,
        unitPrice,
        quantity,
        lineTotal
      };
    });

    // Roughly a third of orders redeem one of the seeded coupons.
    let discountTotal = 0;
    let couponCode = null;
    let freeShipping = false;
    if (index % 3 === 0 && coupons.length) {
      const coupon = pick(coupons.filter((c) => !c.minOrderValue || subtotal >= c.minOrderValue));
      if (coupon) {
        if (coupon.type === 'percentage') discountTotal = round2(subtotal * (coupon.value / 100));
        else if (coupon.type === 'fixed') discountTotal = round2(Math.min(coupon.value, subtotal));
        else if (coupon.type === 'free_shipping') freeShipping = true;
        if (coupon.maxDiscount) discountTotal = Math.min(discountTotal, coupon.maxDiscount);
        couponCode = coupon.code;
        couponUsage.set(String(coupon._id), (couponUsage.get(String(coupon._id)) || 0) + 1);
      }
    }

    const shippingFee = computeShippingFee(subtotal, freeShipping);
    const total = round2(Math.max(0, subtotal - discountTotal) + shippingFee);

    const shippingAddress = address
      ? {
          firstName: address.firstName, lastName: address.lastName, phone: address.phone,
          country: address.country, city: address.city, area: address.area, street: address.street,
          building: address.building, floor: address.floor, apartment: address.apartment, notes: address.notes
        }
      : {
          firstName: customer.fullName.split(' ')[0], lastName: customer.fullName.split(' ').slice(1).join(' ') || 'Customer',
          phone: customer.phone, country: 'Egypt', city: 'Cairo', area: 'Nasr City', street: 'El Nasr St.'
        };

    orders.push({
      _id: new mongoose.Types.ObjectId(),
      orderNumber: orderNumber(-plan.daysAgo),
      user: customer._id,
      items,
      subtotal,
      discountTotal,
      shippingFee,
      total,
      currency: 'EGP',
      couponCode,
      paymentMethod: 'cash_on_delivery',
      paymentStatus: plan.paymentStatus,
      orderStatus: plan.status,
      shippingAddress,
      notes: undefined,
      cancelReason: plan.status === 'cancelled' ? pick(CANCEL_REASONS) : null,
      createdAt: daysFromNow(-plan.daysAgo)
    });
  });

  return { orders, couponUsage };
}

module.exports = { generateOrders };
