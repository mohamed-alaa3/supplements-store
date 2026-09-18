const { body } = require('express-validator');

const couponRules = [
  body('code').trim().notEmpty(),
  body('type').isIn(['percentage', 'fixed', 'free_shipping']),
  body('value').isFloat({ min: 0 }),
  body('minOrderValue').optional().isFloat({ min: 0 }),
  body('maxDiscount').optional().isFloat({ min: 0 }),
  body('usageLimit').optional().isInt({ min: 0 }),
  body('perUserLimit').optional().isInt({ min: 0 })
];

module.exports = { couponRules };
