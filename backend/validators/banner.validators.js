const { body } = require('express-validator');

const bannerRules = [
  body('titleAr').trim().notEmpty(),
  body('titleEn').trim().notEmpty(),
  body('imageUrl').trim().notEmpty(),
  body('linkUrl').optional().isString(),
  body('sortOrder').optional().isInt()
];

const bannerUpdateRules = [
  body('titleAr').optional().trim().notEmpty(),
  body('titleEn').optional().trim().notEmpty(),
  body('imageUrl').optional().trim().notEmpty(),
  body('linkUrl').optional().isString(),
  body('sortOrder').optional().isInt(),
  body('isActive').optional().isBoolean()
];

module.exports = { bannerRules, bannerUpdateRules };
