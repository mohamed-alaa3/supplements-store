const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    nameAr: { type: String, required: true },
    nameEn: { type: String, required: true },
    sku: { type: String, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProfile', required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    firstName: String, lastName: String, phone: String,
    country: String, city: String, area: String, street: String,
    building: String, floor: String, apartment: String, notes: String
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, required: true, min: 0, default: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'EGP' },
    couponCode: { type: String, default: null },
    paymentMethod: { type: String, required: true, default: 'cash_on_delivery' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
      index: true
    },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    notes: { type: String },
    cancelReason: { type: String, default: null }
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'items.seller': 1 });

module.exports = mongoose.model('Order', orderSchema);
