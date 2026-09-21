const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
    url: { type: String, required: true },
    altAr: { type: String },
    altEn: { type: String },
    sortOrder: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false }
  },
  { timestamps: true }
);

productImageSchema.index({ product: 1, sortOrder: 1 });

module.exports = mongoose.model('ProductImage', productImageSchema);
