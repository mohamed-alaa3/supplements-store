const { body } = require('express-validator');
const Product = require('../models/Product');

const productRules = [
  body('nameAr').trim().notEmpty(),
  body('nameEn').trim().notEmpty(),
  body('category').isMongoId().withMessage('A valid category id is required'),
  body('productType').isIn(Product.PRODUCT_TYPES),
  body('basePrice').isFloat({ min: 0 }),
  body('compareAtPrice').optional().isFloat({ min: 0 }),
  body('discountType').optional().isIn(['none', 'percentage', 'fixed']),
  body('discountValue').optional().isFloat({ min: 0 }),
  body('brand').optional().isMongoId()
];

// PATCH is a partial update — every field is optional here, but any field
// that IS present still has to be well-formed (brief §6 "validate").
const productUpdateRules = [
  body('nameAr').optional().trim().notEmpty(),
  body('nameEn').optional().trim().notEmpty(),
  body('category').optional().isMongoId(),
  body('productType').optional().isIn(Product.PRODUCT_TYPES),
  body('basePrice').optional().isFloat({ min: 0 }),
  body('compareAtPrice').optional().isFloat({ min: 0 }),
  body('discountType').optional().isIn(['none', 'percentage', 'fixed']),
  body('discountValue').optional().isFloat({ min: 0 }),
  body('brand').optional().isMongoId()
];

const variantRules = [
  body('sku').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('compareAtPrice').optional().isFloat({ min: 0 }),
  body('flavor').optional().isString(),
  body('sizeLabel').optional().isString(),
  body('servings').optional().isFloat({ min: 0 })
];

const variantUpdateRules = [
  body('sku').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('compareAtPrice').optional().isFloat({ min: 0 }),
  body('flavor').optional().isString(),
  body('sizeLabel').optional().isString(),
  body('servings').optional().isFloat({ min: 0 })
];

module.exports = { productRules, productUpdateRules, variantRules, variantUpdateRules };
