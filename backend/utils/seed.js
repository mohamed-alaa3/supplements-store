/* eslint-disable no-console */
/**
 * Optional convenience seed script — creates one admin user, one category,
 * one brand, one seller (active) with a product + variant + inventory, so
 * `npm run seed` gives you something to hit the API with right away.
 * Safe to re-run: it skips anything that already exists.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const mongoose = require('mongoose');

const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const ProductImage = require('../models/ProductImage');

async function upsertAdmin() {
  const email = 'admin@supplements.test';
  let admin = await User.findOne({ email });
  if (admin) return admin;
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  admin = await User.create({ fullName: 'Store Admin', email, passwordHash, role: 'admin' });
  console.log('Created admin:', email, '/ Admin123!');
  return admin;
}

async function upsertCategory() {
  let category = await Category.findOne({ slug: 'protein' });
  if (category) return category;
  category = await Category.create({ nameAr: 'بروتين', nameEn: 'Protein', slug: 'protein', sortOrder: 1 });
  console.log('Created category: Protein');
  return category;
}

async function upsertBrand() {
  let brand = await Brand.findOne({ slug: 'ironcore' });
  if (brand) return brand;
  brand = await Brand.create({ name: 'IronCore', slug: 'ironcore', country: 'EG' });
  console.log('Created brand: IronCore');
  return brand;
}

async function upsertSeller() {
  const email = 'seller@supplements.test';
  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await bcrypt.hash('Seller123!', 10);
    user = await User.create({ fullName: 'Demo Seller', email, passwordHash, role: 'seller' });
    console.log('Created seller user:', email, '/ Seller123!');
  }
  let profile = await SellerProfile.findOne({ user: user._id });
  if (!profile) {
    profile = await SellerProfile.create({
      user: user._id, storeName: 'IronCore Nutrition', slug: 'ironcore-nutrition', status: 'active'
    });
    console.log('Created seller profile: IronCore Nutrition (active)');
  }
  return profile;
}

async function upsertProduct(category, brand, seller) {
  let product = await Product.findOne({ slug: 'whey-power-protein' });
  if (!product) {
    product = await Product.create({
      nameAr: 'واي باور بروتين', nameEn: 'Whey Power Protein', slug: 'whey-power-protein',
      shortDescriptionAr: 'بروتين مصل اللبن عالي الجودة', shortDescriptionEn: '25g whey protein per serving',
      seller: seller._id, brand: brand._id, category: category._id, productType: 'protein',
      basePrice: 1200, discountType: 'percentage', discountValue: 10,
      tags: ['whey', 'protein', 'muscle'], isFeatured: true, isBestSeller: true
    });
    console.log('Created product: Whey Power Protein');
  }

  let variant = await ProductVariant.findOne({ product: product._id });
  if (!variant) {
    variant = await ProductVariant.create({
      product: product._id, sku: 'WPP-CHOC-2KG', nameEn: 'Chocolate 2kg', nameAr: 'شوكولاتة 2 كجم',
      flavor: 'Chocolate', sizeLabel: '2kg', servings: 66, price: 1200, isDefault: true
    });
    await Inventory.create({ variant: variant._id, stockQuantity: 40, lowStockThreshold: 5, trackInventory: true });
    await ProductImage.create({
      product: product._id, url: 'https://placehold.co/800x800?text=Whey+Power', isPrimary: true, sortOrder: 0
    });
    console.log('Created variant + inventory + image for Whey Power Protein');
  }
}

async function run() {
  await connectDB();
  console.log('[seed] connected to MongoDB');

  const admin = await upsertAdmin();
  const category = await upsertCategory();
  const brand = await upsertBrand();
  const seller = await upsertSeller();
  await upsertProduct(category, brand, seller);

  console.log('[seed] done');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
