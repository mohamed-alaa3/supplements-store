const { body } = require('express-validator');

const brandRules = [
  body('name').trim().notEmpty(),
  body('description').optional().isString(),
  body('logoUrl').optional().isString()
];

const brandUpdateRules = [
  body('name').optional().trim().notEmpty(),
  body('description').optional().isString(),
  body('logoUrl').optional().isString(),
  body('isActive').optional().isBoolean()
];

const categoryRules = [
  body('nameAr').trim().notEmpty(),
  body('nameEn').trim().notEmpty(),
  body('parent').optional({ nullable: true }).isMongoId()
];

const categoryUpdateRules = [
  body('nameAr').optional().trim().notEmpty(),
  body('nameEn').optional().trim().notEmpty(),
  body('parent').optional({ nullable: true }).isMongoId(),
  body('sortOrder').optional().isInt(),
  body('isActive').optional().isBoolean()
];

module.exports = { brandRules, brandUpdateRules, categoryRules, categoryUpdateRules };
