const { body } = require("express-validator");

const addCartItemRules = [
  body("variant").isMongoId().withMessage("A valid variant id is required"),

  body("quantity")
    .isInt({ min: 1, max: 20 })
    .withMessage("Quantity must be between 1 and 20"),
];

const updateCartItemRules = [
  body("quantity")
    .isInt({ min: 1, max: 20 })
    .withMessage("Quantity must be between 1 and 20"),
];

const applyCouponRules = [
  body("code").trim().notEmpty().withMessage("Coupon code is required"),
];

module.exports = {
  addCartItemRules,
  updateCartItemRules,
  applyCouponRules,
};
