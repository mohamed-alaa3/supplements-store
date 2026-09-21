const slugify = require("slugify");
const SellerProfile = require("../models/SellerProfile");

/**
 * Returns the seller profile for a user, creating a valid active profile when
 * a legacy account has role="seller" but its SellerProfile is missing.
 *
 * This is intentionally limited to authenticated seller users; protect()
 * already guarantees the user exists and is active.
 */
async function getOrCreateSellerProfile(user) {
  let profile = await SellerProfile.findOne({ user: user._id });

  if (profile) {
    return profile;
  }

  const baseName = `${user.fullName || "Seller"}'s Store`;
  const baseSlug = slugify(baseName, { lower: true, strict: true }) || `seller-${String(user._id).slice(-8)}`;

  let slug = baseSlug;
  let counter = 1;
  while (await SellerProfile.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  profile = await SellerProfile.create({
    user: user._id,
    storeName: baseName,
    slug,
    status: "active",
  });

  return profile;
}

module.exports = { getOrCreateSellerProfile };
