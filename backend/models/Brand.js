const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String },
    logoUrl: { type: String },
    country: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// slug already has unique:true inline above, which creates its own unique index —
// no separate schema.index() call needed (avoids Mongoose's duplicate-index warning).

module.exports = mongoose.model('Brand', brandSchema);
