const { body } = require('express-validator');

const addressRules = [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('country').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('area').trim().notEmpty(),
  body('street').trim().notEmpty(),
  body('label').optional().isString(),
  body('isDefault').optional().isBoolean()
];

module.exports = { addressRules };
