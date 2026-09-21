const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    titleAr: { type: String, required: true },
    titleEn: { type: String, required: true },
    subtitleAr: { type: String },
    subtitleEn: { type: String },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
