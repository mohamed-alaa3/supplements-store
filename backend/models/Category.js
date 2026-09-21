const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
