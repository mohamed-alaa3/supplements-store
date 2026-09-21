const router = require("express").Router();

const sellerCtrl = require("../controllers/order.controller");
const inventoryCtrl = require("../controllers/inventory.controller");

const { protect } = require("../middlewares/protect");
const authorizeSeller = require("../middlewares/authorizeSeller");
const validate = require("../middlewares/validate");

const { sellerOrderStatusRules } = require("../validators/status.validators");

router.use(protect, authorizeSeller);

router.get("/orders", sellerCtrl.sellerOrders);

router.patch(
  "/orders/:orderId/status",
  sellerOrderStatusRules,
  validate,
  (req, res, next) => {
    req.params.id = req.params.orderId;
    return sellerCtrl.sellerUpdateStatus(req, res, next);
  },
);

router.get(
  "/summary",
  require("../controllers/seller.controller").getMySummary,
);

router.get("/inventory", inventoryCtrl.getMyInventory);

module.exports = router;
