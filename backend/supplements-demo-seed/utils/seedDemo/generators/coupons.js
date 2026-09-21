const mongoose = require('mongoose');
const { daysFromNow } = require('../rng');

/**
 * `applicableCategories` are resolved against real Category ids so FIT15 is
 * genuinely scoped the way services/coupon.service.js checks it (see
 * evaluateCoupon: a coupon with applicableCategories only applies when the
 * cart contains a product from one of those categories).
 */
function generateCoupons({ categoryByName, admin }) {
  const coupons = [
    {
      code: 'WELCOME10', type: 'percentage', value: 10,
      minOrderValue: 0, maxDiscount: 300,
      startsAt: daysFromNow(-30), expiresAt: daysFromNow(90),
      usageLimit: 500, usedCount: 0, perUserLimit: 1,
      applicableProducts: [], applicableCategories: [],
      isActive: true, createdBy: admin._id
    },
    {
      code: 'FIT15', type: 'percentage', value: 15,
      minOrderValue: 500, maxDiscount: 400,
      startsAt: daysFromNow(-15), expiresAt: daysFromNow(60),
      usageLimit: 200, usedCount: 0, perUserLimit: 2,
      applicableProducts: [],
      applicableCategories: [
        categoryByName['Energy & Performance']._id,
        categoryByName['Amino Acids']._id
      ],
      isActive: true, createdBy: admin._id
    },
    {
      code: 'NEWUSER20', type: 'fixed', value: 200,
      minOrderValue: 800,
      startsAt: daysFromNow(-60), expiresAt: daysFromNow(120),
      usageLimit: 1000, usedCount: 0, perUserLimit: 1,
      applicableProducts: [], applicableCategories: [],
      isActive: true, createdBy: admin._id
    },
    {
      code: 'BUNDLE10', type: 'percentage', value: 10,
      minOrderValue: 1000, maxDiscount: 500,
      startsAt: daysFromNow(-10), expiresAt: daysFromNow(45),
      usageLimit: 300, usedCount: 0, perUserLimit: 3,
      applicableProducts: [], applicableCategories: [],
      isActive: true, createdBy: admin._id
    },
    {
      code: 'FREESHIP', type: 'free_shipping', value: 0,
      minOrderValue: 300,
      startsAt: daysFromNow(-5), expiresAt: daysFromNow(30),
      usageLimit: 400, usedCount: 0, perUserLimit: 2,
      applicableProducts: [], applicableCategories: [],
      isActive: true, createdBy: admin._id
    }
  ].map((c) => ({ _id: new mongoose.Types.ObjectId(), ...c }));

  return { coupons };
}

module.exports = { generateCoupons };
