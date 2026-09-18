const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: true, timestamps: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
