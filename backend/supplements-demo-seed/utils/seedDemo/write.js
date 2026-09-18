/* eslint-disable no-console */
const mongoose = require('mongoose');

const User = require('../../models/User');
const SellerProfile = require('../../models/SellerProfile');
const Brand = require('../../models/Brand');
const Category = require('../../models/Category');
const Product = require('../../models/Product');
const ProductVariant = require('../../models/ProductVariant');
const ProductImage = require('../../models/ProductImage');
const Inventory = require('../../models/Inventory');
const Banner = require('../../models/Banner');
const Bundle = require('../../models/Bundle');
const Coupon = require('../../models/Coupon');
const Review = require('../../models/Review');
const Address = require('../../models/Address');
const Order = require('../../models/Order');
const Cart = require('../../models/Cart');
const Wishlist = require('../../models/Wishlist');

const DEMO_EMAIL_DOMAINS = ['@supplements.test', '@customer-demo.test'];

/**
 * Clears only documents this seed script could plausibly have created,
 * identified by the fixed demo email domains — never a blanket
 * `deleteMany({})`, so running this against a database that already has
 * real accounts won't touch them.
 */
async function clearDemoData({ brandSlugs, categorySlugs, couponCodes }) {
  const demoUsers = await User.find({
    email: { $in: DEMO_EMAIL_DOMAINS.map((d) => new RegExp(d.replace('.', '\\.') + '$')) }
  }).select('_id role');
  const demoUserIds = demoUsers.map((u) => u._id);
  const demoSellerProfiles = await SellerProfile.find({ user: { $in: demoUserIds } }).select('_id');
  const demoSellerIds = demoSellerProfiles.map((s) => s._id);
  const demoProducts = await Product.find({ seller: { $in: demoSellerIds } }).select('_id');
  const demoProductIds = demoProducts.map((p) => p._id);
  const demoVariants = await ProductVariant.find({ product: { $in: demoProductIds } }).select('_id');
  const demoVariantIds = demoVariants.map((v) => v._id);

  await Promise.all([
    Order.deleteMany({ user: { $in: demoUserIds } }),
    Cart.deleteMany({ user: { $in: demoUserIds } }),
    Wishlist.deleteMany({ user: { $in: demoUserIds } }),
    Review.deleteMany({ user: { $in: demoUserIds } }),
    Address.deleteMany({ user: { $in: demoUserIds } }),
    Inventory.deleteMany({ variant: { $in: demoVariantIds } }),
    ProductImage.deleteMany({ product: { $in: demoProductIds } }),
    ProductVariant.deleteMany({ product: { $in: demoProductIds } }),
    Bundle.deleteMany({ seller: { $in: demoSellerIds } }),
    Bundle.deleteMany({ seller: null, imageUrl: /placehold\.co/ }), // platform-curated demo bundles (seller: null)
    Coupon.deleteMany({ code: { $in: couponCodes } }),
    Banner.deleteMany({ imageUrl: /placehold\.co/ }),
    // Re-created fresh every run (see writeDataset) since their ObjectIds are
    // regenerated each build and Mongo forbids changing _id on an update —
    // an upsert-by-slug would fail on the second run otherwise.
    Brand.deleteMany({ slug: { $in: brandSlugs } }),
    Category.deleteMany({ slug: { $in: categorySlugs } })
  ]);
  await Product.deleteMany({ _id: { $in: demoProductIds } });
  await SellerProfile.deleteMany({ _id: { $in: demoSellerIds } });
  await User.deleteMany({ _id: { $in: demoUserIds } });
  console.log(`[seed] Cleared previous demo data (${demoUserIds.length} demo users and everything under them).`);
}

async function writeDataset(dataset) {
  const {
    admin, sellers, customers, brands, categories, products, variants, images,
    inventory, banners, bundles, coupons, reviews, addresses, orders, carts, wishlists
  } = dataset;

  await clearDemoData({
    brandSlugs: brands.map((b) => b.slug),
    categorySlugs: categories.map((c) => c.slug),
    couponCodes: coupons.map((c) => c.code)
  });

  await User.insertMany([admin, ...sellers.map((s) => s.user), ...customers]);
  console.log(`[seed] Created 1 admin, ${sellers.length} sellers, ${customers.length} customers`);

  await SellerProfile.insertMany(sellers.map((s) => s.profile));
  console.log(`[seed] Created ${sellers.length} seller profiles`);

  await Brand.insertMany(brands);
  await Category.insertMany(categories);
  console.log(`[seed] Created ${brands.length} brands, ${categories.length} categories`);

  await Product.insertMany(products);
  console.log(`[seed] Created ${products.length} products`);

  await ProductVariant.insertMany(variants);
  console.log(`[seed] Created ${variants.length} product variants`);

  await ProductImage.insertMany(images);
  console.log(`[seed] Created ${images.length} product images`);

  await Inventory.insertMany(inventory);
  console.log(`[seed] Created ${inventory.length} inventory records`);

  await Banner.insertMany(banners);
  console.log(`[seed] Created ${banners.length} banners`);

  await Bundle.insertMany(bundles);
  console.log(`[seed] Created ${bundles.length} bundles`);

  await Coupon.insertMany(coupons);
  console.log(`[seed] Created ${coupons.length} coupons`);

  await Review.insertMany(reviews);
  console.log(`[seed] Created ${reviews.length} reviews`);
  // ratingAverage/reviewCount on `products` were already set by generateReviews()
  // before insertMany above, so no extra write-back pass is needed here.

  await Address.insertMany(addresses);
  console.log(`[seed] Created ${addresses.length} addresses`);

  await Order.insertMany(orders);
  console.log(`[seed] Created ${orders.length} orders`);

  await Cart.insertMany(carts);
  console.log(`[seed] Created ${carts.length} carts`);

  await Wishlist.insertMany(wishlists);
  console.log(`[seed] Created ${wishlists.length} wishlists`);
}

module.exports = { writeDataset, clearDemoData };
