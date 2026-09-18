const { body } = require("express-validator");

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const SELLER_ORDER_STATUSES = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const orderStatusRules = [
  body("status")
    .isIn(ORDER_STATUSES)
    .withMessage(`status must be one of: ${ORDER_STATUSES.join(", ")}`),
];

const sellerOrderStatusRules = [
  body("status")
    .isIn(SELLER_ORDER_STATUSES)
    .withMessage(`status must be one of: ${SELLER_ORDER_STATUSES.join(", ")}`),
];

const sellerStatusRules = [
  body("status")
    .isIn(["pending", "active", "suspended"])
    .withMessage("Invalid seller status"),
];

const userStatusRules = [
  body("isActive").isBoolean().withMessage("isActive must be a boolean"),
];

const userRoleRules = [
  body("role")
    .isIn(["customer", "seller", "admin"])
    .withMessage("Invalid user role"),
];

const reviewStatusRules = [
  body("status")
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Invalid review status"),
];

module.exports = {
  orderStatusRules,
  sellerOrderStatusRules,
  sellerStatusRules,
  userStatusRules,
  userRoleRules,
  reviewStatusRules,
};
