const { body } = require('express-validator');

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().notEmpty(),
  body('title').optional().isString(),
  body('order').optional().isMongoId()
];

module.exports = { reviewRules };
