const ApiError = require("../utils/ApiError");
const { getOrCreateSellerProfile } = require("../utils/sellerProfile");

async function authorizeSeller(req, res, next) {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (req.user.role !== "seller") {
      return next(ApiError.forbidden("Seller role is required"));
    }

    // Legacy/self-healing path: an account can already have role="seller"
    // while its SellerProfile is missing because it was promoted by the old
    // generic role endpoint. Repair it once instead of blocking the dashboard.
    const profile = await getOrCreateSellerProfile(req.user);

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
