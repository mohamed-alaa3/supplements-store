/* eslint-disable no-console */
const mongoose = require('mongoose');

// Requiring the real model files registers their schemas with mongoose,
// which is all validateSync() needs — no DB connection involved.
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

function validateAll(Model, docs, label, errors) {
  docs.forEach((doc, i) => {
    const instance = new Model(doc);
    const err = instance.validateSync();
    if (err) {
      errors.push(`[${label} #${i}] ${doc._id || ''} ${err.message}`);
    }
  });
}

function checkUnique(docs, field, label, errors, { caseInsensitive = false } = {}) {
  const seen = new Set();
  docs.forEach((doc) => {
    const raw = field.split('.').reduce((o, k) => (o ? o[k] : undefined), doc);
    if (raw === undefined || raw === null) return;
    const value = caseInsensitive ? String(raw).toLowerCase() : String(raw);
    if (seen.has(value)) errors.push(`[${label}] duplicate ${field}: "${raw}"`);
    seen.add(value);
  });
}

function checkRef(docs, field, validIds, label, errors, { required = true } = {}) {
  const idSet = new Set(validIds.map(String));
  docs.forEach((doc, i) => {
    const raw = field.split('.').reduce((o, k) => (o ? o[k] : undefined), doc);
    if (raw === undefined || raw === null) {
      if (required) errors.push(`[${label} #${i}] missing required ref "${field}"`);
      return;
    }
    if (!idSet.has(String(raw))) errors.push(`[${label} #${i}] dangling ref "${field}" -> ${raw}`);
  });
}

async function verifyDataset(dataset) {
  const errors = [];
  const {
    admin, sellers, customers, brands, categories, products, variants, images,
    inventory, banners, bundles, coupons, reviews, addresses, orders, carts, wishlists
  } = dataset;

  const allUsers = [admin, ...sellers.map((s) => s.user), ...customers];
  const sellerProfiles = sellers.map((s) => s.profile);

  // ---- Schema validation (matches the real Mongoose models exactly) -------
  validateAll(User, allUsers, 'User', errors);
  validateAll(SellerProfile, sellerProfiles, 'SellerProfile', errors);
  validateAll(Brand, brands, 'Brand', errors);
  validateAll(Category, categories, 'Category', errors);
  validateAll(Product, products, 'Product', errors);
  validateAll(ProductVariant, variants, 'ProductVariant', errors);
  validateAll(ProductImage, images, 'ProductImage', errors);
  validateAll(Inventory, inventory, 'Inventory', errors);
  validateAll(Banner, banners, 'Banner', errors);
  validateAll(Bundle, bundles, 'Bundle', errors);
  validateAll(Coupon, coupons, 'Coupon', errors);
  validateAll(Review, reviews, 'Review', errors);
  validateAll(Address, addresses, 'Address', errors);
  validateAll(Order, orders, 'Order', errors);
  validateAll(Cart, carts, 'Cart', errors);
  validateAll(Wishlist, wishlists, 'Wishlist', errors);

  // ---- Uniqueness (mirrors each model's `unique: true` indexes) -----------
  checkUnique(allUsers, 'email', 'User', errors, { caseInsensitive: true });
  checkUnique(sellerProfiles, 'user', 'SellerProfile', errors);
  checkUnique(sellerProfiles, 'slug', 'SellerProfile', errors);
  checkUnique(brands, 'name', 'Brand', errors);
  checkUnique(brands, 'slug', 'Brand', errors);
  checkUnique(categories, 'slug', 'Category', errors);
  checkUnique(products, 'slug', 'Product', errors);
  checkUnique(variants, 'sku', 'ProductVariant', errors);
  checkUnique(inventory, 'variant', 'Inventory', errors);
  checkUnique(bundles, 'slug', 'Bundle', errors);
  checkUnique(coupons, 'code', 'Coupon', errors, { caseInsensitive: true });
  checkUnique(carts, 'user', 'Cart', errors);
  checkUnique(wishlists, 'user', 'Wishlist', errors);
  reviews.forEach((r, i) => {
    // unique compound index on (user, product)
    const key = `${r.user}:${r.product}`;
    reviews.__seen = reviews.__seen || new Set();
    if (reviews.__seen.has(key)) errors.push(`[Review #${i}] duplicate review for same user+product`);
    reviews.__seen.add(key);
  });

  // ---- Referential integrity (every ref points at something we generated) -
  const userIds = allUsers.map((u) => u._id);
  const customerIds = customers.map((c) => c._id);
  const sellerProfileIds = sellerProfiles.map((s) => s._id);
  const brandIds = brands.map((b) => b._id);
  const categoryIds = categories.map((c) => c._id);
  const productIds = products.map((p) => p._id);
  const variantIds = variants.map((v) => v._id);
  const couponIds = coupons.map((c) => c._id);

  checkRef(sellerProfiles, 'user', userIds, 'SellerProfile', errors);
  checkRef(products, 'seller', sellerProfileIds, 'Product', errors);
  checkRef(products, 'brand', brandIds, 'Product', errors);
  checkRef(products, 'category', categoryIds, 'Product', errors);
  checkRef(variants, 'product', productIds, 'ProductVariant', errors);
  checkRef(images, 'product', productIds, 'ProductImage', errors);
  checkRef(inventory, 'variant', variantIds, 'Inventory', errors);
  checkRef(addresses, 'user', customerIds, 'Address', errors);
  checkRef(reviews, 'user', customerIds, 'Review', errors);
  checkRef(reviews, 'product', productIds, 'Review', errors);
  checkRef(orders, 'user', customerIds, 'Order', errors);
  checkRef(carts, 'user', customerIds, 'Cart', errors);
  checkRef(wishlists, 'user', customerIds, 'Wishlist', errors);

  bundles.forEach((bundle, bi) => {
    bundle.items.forEach((item, ii) => {
      if (!variantIds.some((id) => String(id) === String(item.variant))) {
        errors.push(`[Bundle #${bi}] item #${ii} dangling variant ref -> ${item.variant}`);
      }
    });
    if (bundle.seller && !sellerProfileIds.some((id) => String(id) === String(bundle.seller))) {
      errors.push(`[Bundle #${bi}] dangling seller ref -> ${bundle.seller}`);
    }
  });

  coupons.forEach((coupon, ci) => {
    (coupon.applicableCategories || []).forEach((catId) => {
      if (!categoryIds.some((id) => String(id) === String(catId))) {
        errors.push(`[Coupon #${ci}] dangling applicableCategories ref -> ${catId}`);
      }
    });
  });

  orders.forEach((order, oi) => {
    order.items.forEach((item, ii) => {
      if (!productIds.some((id) => String(id) === String(item.product))) {
        errors.push(`[Order #${oi}] item #${ii} dangling product ref -> ${item.product}`);
      }
      if (!variantIds.some((id) => String(id) === String(item.variant))) {
        errors.push(`[Order #${oi}] item #${ii} dangling variant ref -> ${item.variant}`);
      }
      if (!sellerProfileIds.some((id) => String(id) === String(item.seller))) {
        errors.push(`[Order #${oi}] item #${ii} dangling seller ref -> ${item.seller}`);
      }
    });
    if (order.couponCode && !couponIds.length) {
      errors.push(`[Order #${oi}] references couponCode "${order.couponCode}" but no coupons exist`);
    }
    // total sanity check: subtotal - discount + shipping should equal total, to the cent
    const expectedTotal = Math.round((Math.max(0, order.subtotal - order.discountTotal) + order.shippingFee) * 100) / 100;
    if (Math.abs(expectedTotal - order.total) > 0.01) {
      errors.push(`[Order #${oi}] total mismatch: expected ${expectedTotal}, got ${order.total}`);
    }
  });

  carts.forEach((cart, ci) => {
    cart.items.forEach((item, ii) => {
      if (!variantIds.some((id) => String(id) === String(item.variant))) {
        errors.push(`[Cart #${ci}] item #${ii} dangling variant ref -> ${item.variant}`);
      }
    });
    if (cart.coupon && !couponIds.some((id) => String(id) === String(cart.coupon))) {
      errors.push(`[Cart #${ci}] dangling coupon ref -> ${cart.coupon}`);
    }
  });

  wishlists.forEach((wishlist, wi) => {
    wishlist.items.forEach((item, ii) => {
      if (!productIds.some((id) => String(id) === String(item.product))) {
        errors.push(`[Wishlist #${wi}] item #${ii} dangling product ref -> ${item.product}`);
      }
      if (item.variant && !variantIds.some((id) => String(id) === String(item.variant))) {
        errors.push(`[Wishlist #${wi}] item #${ii} dangling variant ref -> ${item.variant}`);
      }
    });
  });

  // ---- Aggregate counts, useful in the report regardless of pass/fail -----
  const counts = {
    users: allUsers.length,
    sellers: sellers.length,
    customers: customers.length,
    brands: brands.length,
    categories: categories.length,
    products: products.length,
    variants: variants.length,
    images: images.length,
    inventory: inventory.length,
    banners: banners.length,
    bundles: bundles.length,
    coupons: coupons.length,
    reviews: reviews.length,
    addresses: addresses.length,
    orders: orders.length,
    carts: carts.length,
    wishlists: wishlists.length
  };

  return { errors, counts };
}

module.exports = { verifyDataset };
