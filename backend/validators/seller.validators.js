const { body } = require('express-validator');

// Used by the admin-initiated "convert customer to seller" flow. No file
// uploads / ID documents are collected — the admin can optionally name the
// new store; if omitted, the controller derives a default from the user's
// name.
const convertToSellerRules = [
  body('storeName')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('storeName must be a string')
    .trim()
    .isLength({ min: 2, max: 120 }).withMessage('storeName must be between 2 and 120 characters')
];

module.exports = { convertToSellerRules };
