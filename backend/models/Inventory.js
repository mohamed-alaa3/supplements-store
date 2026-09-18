  const mongoose = require('mongoose');

  const inventorySchema = new mongoose.Schema(
    {
      variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true, unique: true },
      stockQuantity: { type: Number, default: 0, min: 0 },
      reservedQuantity: { type: Number, default: 0, min: 0 },
      lowStockThreshold: { type: Number, default: 5, min: 0 },
      trackInventory: { type: Boolean, default: true },
      status: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock', 'disabled'],
        default: 'out_of_stock'
      }
    },
    { timestamps: true }
  );

  /** Keeps `status` consistent with the raw quantities on every save. */
  inventorySchema.methods.recomputeStatus = function recomputeStatus() {
    if (!this.trackInventory) {
      this.status = 'disabled';
      return this.status;
    }
    const available = this.stockQuantity - this.reservedQuantity;
    if (available <= 0) this.status = 'out_of_stock';
    else if (available <= this.lowStockThreshold) this.status = 'low_stock';
    else this.status = 'in_stock';
    return this.status;
  };

  inventorySchema.pre('save', function preSave(next) {
    this.recomputeStatus();
    next();
  });

  module.exports = mongoose.model('Inventory', inventorySchema);
