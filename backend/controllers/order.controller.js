const mongoose = require("mongoose");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess, buildMeta } = require("../utils/apiResponse");
const { parsePagination } = require("../utils/pagination");

const Order = require("../models/Order");
const SellerProfile = require("../models/SellerProfile");

const { createOrderFromCart } = require("../services/checkout.service");

const { restockLines } = require("../services/stock.service");

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const TERMINAL_STATUSES = ["cancelled", "returned"];

/**
 * Restocks an order and changes its status inside ONE transaction.
 *
 * This prevents:
 * - order becoming cancelled while stock restoration fails
 * - double restocking
 * - inconsistent order/stock state
 */
async function changeStatusWithRestock(orderId, newStatus, extra = {}) {
  const session = await mongoose.startSession();

  try {
    let updatedOrder;

    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw ApiError.notFound("Order not found");
      }

      const oldStatus = order.orderStatus;

      if (oldStatus === newStatus) {
        updatedOrder = order;
        return;
      }

      const wasActive = !TERMINAL_STATUSES.includes(oldStatus);
      const becomesTerminal = TERMINAL_STATUSES.includes(newStatus);

      order.orderStatus = newStatus;

      if (extra.cancelReason !== undefined) {
        order.cancelReason = extra.cancelReason;
      }

      // Restock only when moving from an active order
      // to cancelled/returned.
      if (wasActive && becomesTerminal) {
        const lines = order.items.map((item) => ({
          variantId: item.variant,
          quantity: item.quantity,
        }));

        await restockLines(lines, session);
      }

      await order.save({ session });

      updatedOrder = order;
    });

    return updatedOrder;
  } finally {
    await session.endSession();
  }
}

/**
 * POST /api/orders
 *
 * Creates an order from the authenticated user's cart.
 */
const create = asyncHandler(async (req, res) => {
  const { addressId, shippingAddress, paymentMethod, notes } = req.body;

  const order = await createOrderFromCart(req.user._id, {
    addressId,
    shippingAddress,
    paymentMethod,
    notes,
  });

  sendSuccess(res, {
    statusCode: 201,
    data: order,
    message: "Order placed",
  });
});

/**
 * GET /api/orders/me
 */
const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
  }).sort({ createdAt: -1 });

  sendSuccess(res, {
    data: orders,
  });
});

/**
 * GET /api/orders/:id
 */
const getById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  const isOwner = String(order.user) === String(req.user._id);

  if (!isOwner && req.user.role !== "admin") {
    if (req.user.role === "seller") {
      const profile = await SellerProfile.findOne({
        user: req.user._id,
      });

      const sellerHasLine =
        profile &&
        order.items.some((item) => String(item.seller) === String(profile._id));

      if (!sellerHasLine) {
        throw ApiError.forbidden();
      }
    } else {
      throw ApiError.forbidden();
    }
  }

  sendSuccess(res, {
    data: order,
  });
});

/**
 * POST /api/orders/:id/cancel
 *
 * Customer can cancel only pending or confirmed orders.
 */
const cancel = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  const isAdmin = req.user.role === "admin";
  const isOwner = String(order.user) === String(req.user._id);

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden();
  }

  if (!["pending", "confirmed"].includes(order.orderStatus)) {
    throw ApiError.badRequest(
      `Orders in "${order.orderStatus}" status can no longer be cancelled`,
    );
  }

  const updatedOrder = await changeStatusWithRestock(order._id, "cancelled", {
    cancelReason: req.body.cancelReason,
  });

  sendSuccess(res, {
    data: updatedOrder,
    message: "Order cancelled",
  });
});

// ---- Admin ------------------------------------------------------------------

/**
 * GET /api/admin/orders
 *
 * Admin order listing with:
 * - status filter
 * - search by order number
 * - sorting
 * - pagination
 */
const adminList = asyncHandler(async (req, res) => {
  const { status, search, sort = "newest" } = req.query;

  if (status && !ORDER_STATUSES.includes(status)) {
    throw ApiError.badRequest("Invalid order status");
  }

  const allowedSorts = ["newest", "oldest", "total_asc", "total_desc"];

  if (!allowedSorts.includes(sort)) {
    throw ApiError.badRequest("Invalid order sort");
  }

  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};

  if (status) {
    filter.orderStatus = status;
  }

  if (search && search.trim()) {
    filter.orderNumber = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  let sortQuery = { createdAt: -1 };

  switch (sort) {
    case "oldest":
      sortQuery = { createdAt: 1 };
      break;

    case "total_asc":
      sortQuery = { total: 1 };
      break;

    case "total_desc":
      sortQuery = { total: -1 };
      break;

    case "newest":
    default:
      sortQuery = { createdAt: -1 };
      break;
  }

  const [items, totalItems] = await Promise.all([
    Order.find(filter).sort(sortQuery).skip(skip).limit(limit),

    Order.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: items,
    meta: buildMeta({
      page,
      limit,
      totalItems,
    }),
  });
});

/**
 * Admin can change an order to any valid status.
 *
 * If an active order becomes cancelled/returned,
 * stock is restored in the same transaction.
 */
const adminUpdateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    throw ApiError.badRequest("Invalid order status");
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  const updatedOrder = await changeStatusWithRestock(order._id, status);

  sendSuccess(res, {
    data: updatedOrder,
    message: "Order status updated",
  });
});

// ---- Seller -----------------------------------------------------------------

/**
 * GET /api/seller/orders
 */
const sellerOrders = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({
    user: req.user._id,
  });

  if (!profile) {
    throw ApiError.notFound("No seller profile found for this account");
  }

  const orders = await Order.find({
    "items.seller": profile._id,
  }).sort({
    createdAt: -1,
  });

  sendSuccess(res, {
    data: orders,
  });
});

/**
 * Seller status transitions.
 *
 * Sellers cannot cancel or return orders.
 * They can move orders forward through fulfillment.
 */
const SELLER_TRANSITIONS = {
  pending: ["confirmed", "processing"],
  confirmed: ["processing"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  returned: [],
};

/**
 * PATCH /api/seller/orders/:id/status
 */
const sellerUpdateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    throw ApiError.badRequest("Invalid order status");
  }

  const profile = await SellerProfile.findOne({
    user: req.user._id,
  });

  if (!profile) {
    throw ApiError.notFound("No seller profile found for this account");
  }

  const order = await Order.findOne({
    _id: req.params.id,
    "items.seller": profile._id,
  });

  if (!order) {
    throw ApiError.notFound("Order not found for this seller");
  }

  const allowedStatuses = SELLER_TRANSITIONS[order.orderStatus] || [];

  if (!allowedStatuses.includes(status)) {
    throw ApiError.badRequest(
      `Seller cannot change order from "${order.orderStatus}" to "${status}"`,
    );
  }

  order.orderStatus = status;

  await order.save();

  sendSuccess(res, {
    data: order,
    message: "Order status updated",
  });
});

module.exports = {
  create,
  myOrders,
  getById,
  cancel,
  adminList,
  adminUpdateStatus,
  sellerOrders,
  sellerUpdateStatus,
};
