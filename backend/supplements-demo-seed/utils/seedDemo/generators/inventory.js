const mongoose = require('mongoose');
const { randomInt, chance } = require('../rng');

/**
 * The real Inventory model recomputes `status` from the quantities in a
 * pre('save') hook (models/Inventory.js). We mirror that exact formula here
 * so the `status` we hand to the DB write step is already correct even
 * before the hook runs — and so the offline validator (which doesn't run
 * Mongoose middleware) still sees a consistent document.
 */
function statusFor(stockQuantity, reservedQuantity, lowStockThreshold, trackInventory) {
  if (!trackInventory) return 'disabled';
  const available = stockQuantity - reservedQuantity;
  if (available <= 0) return 'out_of_stock';
  if (available <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

function generateInventory(variants) {
  return variants.map((variant) => {
    const lowStockThreshold = randomInt(5, 10);
    let stockQuantity;
    let reservedQuantity;

    if (chance(0.15)) {
      // out of stock
      stockQuantity = randomInt(0, 3);
      reservedQuantity = stockQuantity; // fully reserved or simply empty
    } else if (chance(0.24)) {
      // low stock: available sits at or below the threshold but above zero
      const available = randomInt(1, lowStockThreshold);
      reservedQuantity = randomInt(0, 3);
      stockQuantity = available + reservedQuantity;
    } else {
      // healthy stock
      reservedQuantity = randomInt(0, 4);
      stockQuantity = reservedQuantity + randomInt(lowStockThreshold + 5, lowStockThreshold + 100);
    }

    const trackInventory = true;

    return {
      _id: new mongoose.Types.ObjectId(),
      variant: variant._id,
      stockQuantity,
      reservedQuantity,
      lowStockThreshold,
      trackInventory,
      status: statusFor(stockQuantity, reservedQuantity, lowStockThreshold, trackInventory)
    };
  });
}

module.exports = { generateInventory };
