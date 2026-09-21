const mongoose = require('mongoose');

const bundleItemRuleSchema = new mongoose.Schema(
  {
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    quantity: { type: Number, min: 1 },
    minQuantity: { type: Number, min: 0 },
    maxQuantity: { type: Number, min: 0 }
  },
  { _id: false }
);

const bundleSchema = new mongoose.Schema(
  {
    nameAr: { type: String, required: true },
    nameEn: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    bundleType: { type: String, enum: ['fixed', 'configurable'], required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProfile', default: null },
    items: { type: [bundleItemRuleSchema], default: [] },
    bundlePrice: { type: Number, min: 0 },
    discountType: { type: String, enum: ['none', 'percentage', 'fixed'], default: 'none' },
    discountValue: { type: Number, default: 0, min: 0 },
    minItems: { type: Number, min: 0 },
    maxItems: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bundle', bundleSchema);
