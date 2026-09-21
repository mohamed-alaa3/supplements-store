const { generateUsers } = require('./generators/users');
const { generateCatalog } = require('./generators/catalog');
const { generateProducts } = require('./generators/products');
const { generateInventory } = require('./generators/inventory');
const { generateBanners } = require('./generators/banners');
const { generateBundles } = require('./generators/bundles');
const { generateCoupons } = require('./generators/coupons');
const { generateReviews } = require('./generators/reviews');
const { generateAddresses } = require('./generators/addresses');
const { generateOrders } = require('./generators/orders');
const { generateCarts } = require('./generators/carts');
const { generateWishlists } = require('./generators/wishlists');

/**
 * Single source of truth for the demo dataset. Pure/offline — never touches
 * MongoDB — so it can be reused by both the real seed run (write.js) and the
 * offline schema/reference validator (verify.js).
 *
 * Order matters: each generator only receives data from generators that ran
 * before it, mirroring the dependency order the documents must be inserted
 * in later (users/catalog -> products -> inventory/images -> bundles ->
 * coupons -> reviews -> addresses -> orders -> carts/wishlists).
 */
async function buildDataset() {
  const { admin, sellers, customers, credentials } = await generateUsers();
  const { brands, categories, brandByName, categoryByName } = generateCatalog();

  const { products, variants, images } = generateProducts({ categoryByName, brandByName, sellers });
  const inventory = generateInventory(variants);
  const banners = generateBanners();
  const { bundles } = generateBundles({ products, variants, brandByName, sellers });
  const { coupons } = generateCoupons({ categoryByName, admin });
  const { reviews } = generateReviews({ products, customers });
  const { addresses } = generateAddresses(customers);
  const { orders, couponUsage } = generateOrders({ products, variants, customers, addresses, coupons });
  const { carts } = generateCarts(customers, variants, coupons);
  const { wishlists } = generateWishlists(customers, products, variants);

  // Reconcile each coupon's usedCount with how many seeded orders actually redeemed it.
  coupons.forEach((c) => {
    c.usedCount = couponUsage.get(String(c._id)) || 0;
  });

  return {
    admin,
    sellers, // [{ user, profile }]
    customers,
    credentials,
    brands,
    categories,
    products,
    variants,
    images,
    inventory,
    banners,
    bundles,
    coupons,
    reviews,
    addresses,
    orders,
    carts,
    wishlists
  };
}

module.exports = { buildDataset };
