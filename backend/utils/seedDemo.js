/* eslint-disable no-console */
/**
 * Populates the database with a complete, realistic demo catalog for the
 * Supplements e-commerce project: admin/sellers/customers, brands,
 * categories, products with variants/images/inventory, banners, bundles,
 * coupons, reviews, addresses, orders, carts and wishlists.
 *
 * Usage:
 *   npm run seed:demo
 *
 * Safe to re-run: it removes only the demo documents it created itself
 * (matched by the fixed @supplements.test / @customer-demo.test email
 * domains and their dependents) before inserting a fresh copy — see
 * utils/seedDemo/write.js#clearDemoData for exactly what gets removed.
 *
 * See utils/seedDemo/README.md for the full write-up (schema inspection
 * notes, demo credentials, verification report, and how to validate the
 * generated data offline before touching a real database).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { buildDataset } = require('./seedDemo/build');
const { verifyDataset } = require('./seedDemo/verify');
const { writeDataset } = require('./seedDemo/write');

async function main() {
  console.log('[seed] Building demo dataset in memory...');
  const dataset = await buildDataset();

  console.log('[seed] Validating dataset against schemas + references before touching the database...');
  const { errors, counts } = await verifyDataset(dataset);
  if (errors.length) {
    console.error(`[seed] Aborting — ${errors.length} validation problem(s) found:`);
    errors.forEach((e) => console.error('  - ' + e));
    process.exitCode = 1;
    return;
  }
  console.log('[seed] Dataset is valid:', counts);

  console.log('[seed] Connecting to MongoDB...');
  await connectDB();

  try {
    await writeDataset(dataset);
    console.log('[seed] Seed completed successfully.');
    console.log('\n[seed] Demo accounts:');
    console.log(`  Admin:    ${dataset.credentials.admin.email} / ${dataset.credentials.admin.password}`);
    dataset.credentials.sellers.forEach((s) => {
      console.log(`  Seller:   ${s.email} / ${s.password}  (${s.storeName})`);
    });
    console.log(`  Customer: ${dataset.credentials.sampleCustomer.email} / ${dataset.credentials.sampleCustomer.password}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exitCode = 1;
});
