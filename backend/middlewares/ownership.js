const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const SellerProfile = require('../models/SellerProfile');

/**
 * Ensures the authenticated seller owns the resource returned by `loadResource`,
 * or lets an admin through regardless. `loadResource(req)` must resolve to a
 * document with a `.seller` (SellerProfile id) field, or null if not found.
 * On success, attaches the resource to req.resource so the controller does not
 * have to re-fetch it.
 */
function ownsResource(loadResource) {
  return asyncHandler(async (req, res, next) => {
    const resource = await loadResource(req);
    if (!resource) throw ApiError.notFound('Resource not found');

    if (req.user.role === 'admin') {
      req.resource = resource;
      return next();
    }

    if (req.user.role !== 'seller') throw ApiError.forbidden();

    const sellerProfile = await SellerProfile.findOne({ user: req.user._id });
    if (!sellerProfile || String(resource.seller) !== String(sellerProfile._id)) {
      throw ApiError.forbidden('You do not own this resource');
    }

    req.resource = resource;
    req.sellerProfile = sellerProfile;
    next();
  });
}

module.exports = { ownsResource };
