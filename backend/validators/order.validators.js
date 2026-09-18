const { body } = require("express-validator");
const { SUPPORTED_PAYMENT_METHODS } = require("../utils/paymentMethods");

const createOrderRules = [
  body("paymentMethod")
    .trim()
    .notEmpty()
    .withMessage("paymentMethod is required")
    .isIn(SUPPORTED_PAYMENT_METHODS)
    .withMessage(
      `paymentMethod must be one of: ${SUPPORTED_PAYMENT_METHODS.join(", ")}`,
    ),

  body("addressId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("addressId must be a valid address id"),

  body("shippingAddress")
    .optional({ nullable: true })
    .isObject()
    .withMessage("shippingAddress must be an object"),

  body("shippingAddress.firstName")
    .if(body("shippingAddress").exists())
    .trim()
    .notEmpty()
    .withMessage("shippingAddress.firstName is required"),

  body("shippingAddress.lastName")
    .if(body("shippingAddress").exists())
    .trim()
    .notEmpty()
    .withMessage("shippingAddress.lastName is required"),

  body("shippingAddress.phone")
    .if(body("shippingAddress").exists())
    .trim()
    .notEmpty()
    .withMessage("shippingAddress.phone is required"),

  body("shippingAddress.country")
    .if(body("shippingAddress").exists())
    .trim()
    .notEmpty()
    .withMessage("shippingAddress.country is required"),

  body("shippingAddress.city")
    .if(body("shippingAddress").exists())
    .trim()
    .notEmpty()
    .withMessage("shippingAddress.city is required"),

  body("shippingAddress.area")
    .if(body("shippingAddress").exists())
    .trim()
    .notEmpty()
    .withMessage("shippingAddress.area is required"),

  body("shippingAddress.street")
    .if(body("shippingAddress").exists())
    .trim()
    .notEmpty()
    .withMessage("shippingAddress.street is required"),

  body("shippingAddress.building")
    .if(body("shippingAddress").exists())
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body("shippingAddress.floor")
    .if(body("shippingAddress").exists())
    .optional()
    .trim()
    .isLength({ max: 50 }),

  body("shippingAddress.apartment")
    .if(body("shippingAddress").exists())
    .optional()
    .trim()
    .isLength({ max: 50 }),

  body("shippingAddress.notes")
    .if(body("shippingAddress").exists())
    .optional()
    .trim()
    .isLength({ max: 500 }),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("notes cannot exceed 1000 characters"),
];

const cancelOrderRules = [
  body("cancelReason")
    .trim()
    .notEmpty()
    .withMessage("cancelReason is required")
    .isLength({ max: 500 })
    .withMessage("cancelReason cannot exceed 500 characters"),
];

module.exports = {
  createOrderRules,
  cancelOrderRules,
};
