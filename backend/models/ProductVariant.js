const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    nameAr: { type: String },
    nameEn: { type: String },
    flavor: { type: String },
    sizeLabel: { type: String },
    servings: { type: Number, min: 0 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    barcode: { type: String },
    weightGrams: { type: Number, min: 0 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productVariantSchema.index({ product: 1, isActive: 1 });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
