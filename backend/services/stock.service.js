const Inventory = require("../models/Inventory");
const ApiError = require("../utils/ApiError");

/**
 * Loads or lazily creates an inventory row for a variant.
 * New inventory starts with zero stock and inventory tracking enabled.
 */
async function getOrCreateInventory(variantId, session) {
  let inventory = await Inventory.findOne({
    variant: variantId,
  }).session(session || null);

  if (!inventory) {
    inventory = new Inventory({
      variant: variantId,
      stockQuantity: 0,
      reservedQuantity: 0,
      trackInventory: true,
    });

    await inventory.save({ session });
  }

  return inventory;
}

/**
 * Checks whether enough stock is available.
 *
 * This is a normal validation step.
 * The final authoritative check is performed atomically by decrementStock().
 */
async function assertStockAvailable(lines, session) {
  for (const line of lines) {
    const inventory = await Inventory.findOne({
      variant: line.variantId,
    }).session(session || null);

    // If inventory tracking is disabled, the item can always be purchased.
    if (!inventory || !inventory.trackInventory) {
      continue;
    }

    const available = inventory.stockQuantity - inventory.reservedQuantity;

    if (available < line.quantity) {
      throw ApiError.badRequest(
        `Insufficient stock for variant ${line.variantId}`,
      );
    }
  }
}

/**
 * Atomically decrements stock.
 *
 * The database only performs the decrement if enough available stock
 * still exists. This prevents overselling when multiple customers
 * checkout the same variant at the same time.
 */
async function decrementStock(lines, session) {
  for (const line of lines) {
    const inventory = await Inventory.findOne({
      variant: line.variantId,
      trackInventory: true,
    }).session(session || null);

    // Untracked inventory = no stock restriction.
    if (!inventory) {
      continue;
    }

    const result = await Inventory.findOneAndUpdate(
      {
        _id: inventory._id,
        trackInventory: true,
        $expr: {
          $gte: [
            {
              $subtract: ["$stockQuantity", "$reservedQuantity"],
            },
            line.quantity,
          ],
        },
      },
      {
        $inc: {
          stockQuantity: -line.quantity,
        },
      },
      {
        session,
        new: true,
      },
    );

    if (!result) {
      throw ApiError.badRequest(
        `Insufficient stock for variant ${line.variantId}`,
      );
    }

    result.recomputeStatus();
    await result.save({ session });
  }
}

/**
 * Restores stock when an order is cancelled or returned.
 */
async function restockLines(lines, session) {
  for (const line of lines) {
    const inventory = await Inventory.findOne({
      variant: line.variantId,
      trackInventory: true,
    }).session(session || null);

    if (!inventory) {
      continue;
    }

    inventory.stockQuantity += line.quantity;

    inventory.recomputeStatus();

    await inventory.save({ session });
  }
}

module.exports = {
  getOrCreateInventory,
  assertStockAvailable,
  decrementStock,
  restockLines,
};
