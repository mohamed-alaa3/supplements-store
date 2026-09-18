const mongoose = require('mongoose');

const sellerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String },
    logoUrl: { type: String },
    contactPhone: { type: String },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
    verificationNotes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);
