const ApiError = require("../utils/ApiError");
const SellerProfile = require("../models/SellerProfile");

async function authorizeSeller(req, res, next) {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (req.user.role !== "seller") {
      return next(ApiError.forbidden("Seller role is required"));
    }

    const profile = await SellerProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      return next(ApiError.forbidden("Seller profile not found"));
    }

    if (profile.status !== "active") {
      return next(ApiError.forbidden("Your seller account is not active yet"));
    }

    req.sellerProfile = profile;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authorizeSeller;
