const mongoose = require('mongoose');

const PRODUCT_TYPES = [
  'supplement', 'protein', 'vitamin', 'mineral', 'preworkout',
  'amino', 'hydration', 'snack', 'equipment', 'bundle'
];

const productSchema = new mongoose.Schema(
  {
    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    shortDescriptionAr: { type: String },
    shortDescriptionEn: { type: String },
    descriptionAr: { type: String },
    descriptionEn: { type: String },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerProfile",
      default: null,
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    productType: { type: String, enum: PRODUCT_TYPES, required: true },
    basePrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    discountType: {
      type: String,
      enum: ["none", "percentage", "fixed"],
      default: "none",
    },
    discountValue: { type: Number, default: 0, min: 0 },
    // Server-calculated only — never accept these from client payloads.
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ nameEn: 'text', nameAr: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ seller: 1, isActive: 1 });
productSchema.index({ productType: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isBestSeller: 1, isActive: 1 });
productSchema.index({ basePrice: 1 });

productSchema.statics.PRODUCT_TYPES = PRODUCT_TYPES;

module.exports = mongoose.model('Product', productSchema);
