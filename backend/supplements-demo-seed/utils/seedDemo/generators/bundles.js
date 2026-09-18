const mongoose = require('mongoose');
const slugify = require('slugify');
const { buildLookup } = require('../lookup');

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Builds Bundle documents. `fixed` bundles pin a set list of variants+
 * quantities (bundle.items is authoritative — see resolveEffectiveSelections
 * in controllers/bundle.controller.js). `configurable` bundles instead give
 * the customer a min/max quantity range per variant.
 */
function generateBundles({ products, variants, brandByName, sellers }) {
  const { findProduct, defaultVariant } = buildLookup(products, variants);
  const bundles = [];
  const usedSlugs = new Set();

  function uniqueSlug(name) {
    const base = slugify(name, { lower: true, strict: true });
    let slug = base;
    let counter = 1;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${counter++}`;
    }
    usedSlugs.add(slug);
    return slug;
  }

  function fixedItem(nameEn, brandName, quantity = 1) {
    const product = findProduct(nameEn, brandName ? brandByName[brandName]._id : undefined);
    const variant = defaultVariant(product._id);
    return { variant: variant._id, quantity, unitPrice: variant.price };
  }

  // ---- 1. Beginner Starter Bundle (fixed, flat bundle price) --------------
  {
    const items = [
      fixedItem('Whey Starter', 'DailyBalance'),
      fixedItem('Creatine Monohydrate', 'IronCore'),
      fixedItem('Shaker Bottle 700ml', 'GymGear Pro')
    ];
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    bundles.push({
      _id: new mongoose.Types.ObjectId(),
      nameEn: 'Beginner Starter Bundle', nameAr: 'باقة البداية للمبتدئين',
      slug: uniqueSlug('Beginner Starter Bundle'),
      bundleType: 'fixed',
      seller: sellers[0].profile._id,
      items: items.map(({ variant, quantity }) => ({ variant, quantity })),
      bundlePrice: round2(subtotal * 0.85),
      discountType: 'none',
      discountValue: 0,
      isActive: true,
      imageUrl: 'https://placehold.co/800x600/22c55e/ffffff.png?text=Beginner+Starter+Bundle'
    });
  }

  // ---- 2. Muscle Building Bundle (fixed, percentage discount) -------------
  {
    const items = [
      fixedItem('Whey Power Protein', 'IronCore'),
      fixedItem('Mass Gainer XXL', 'IronCore'),
      fixedItem('Creatine Monohydrate', 'TitanFuel')
    ];
    bundles.push({
      _id: new mongoose.Types.ObjectId(),
      nameEn: 'Muscle Building Bundle', nameAr: 'باقة بناء العضلات',
      slug: uniqueSlug('Muscle Building Bundle'),
      bundleType: 'fixed',
      seller: sellers[0].profile._id,
      items: items.map(({ variant, quantity }) => ({ variant, quantity })),
      discountType: 'percentage',
      discountValue: 12,
      isActive: true,
      imageUrl: 'https://placehold.co/800x600/2563eb/ffffff.png?text=Muscle+Building+Bundle'
    });
  }

  // ---- 3. Performance Bundle (fixed, flat bundle price) --------------------
  {
    const items = [
      fixedItem('Pre-Workout Ignite', 'PeakForm'),
      fixedItem('BCAA 2:1:1', 'AminoLab'),
      fixedItem('Beta Alanine', 'PeakForm')
    ];
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    bundles.push({
      _id: new mongoose.Types.ObjectId(),
      nameEn: 'Performance Bundle', nameAr: 'باقة الأداء',
      slug: uniqueSlug('Performance Bundle'),
      bundleType: 'fixed',
      seller: sellers[1].profile._id,
      items: items.map(({ variant, quantity }) => ({ variant, quantity })),
      bundlePrice: round2(subtotal * 0.88),
      discountType: 'none',
      discountValue: 0,
      isActive: true,
      imageUrl: 'https://placehold.co/800x600/f97316/ffffff.png?text=Performance+Bundle'
    });
  }

  // ---- 4. Hydration Bundle (fixed, fixed-amount discount) ------------------
  {
    const items = [
      fixedItem('Electrolyte Powder', 'HydraCharge'),
      fixedItem('Hydration Tablets', 'HydraCharge', 2)
    ];
    bundles.push({
      _id: new mongoose.Types.ObjectId(),
      nameEn: 'Hydration Bundle', nameAr: 'باقة الترطيب',
      slug: uniqueSlug('Hydration Bundle'),
      bundleType: 'fixed',
      seller: sellers[2].profile._id,
      items: items.map(({ variant, quantity }) => ({ variant, quantity })),
      discountType: 'fixed',
      discountValue: 80,
      isActive: true,
      imageUrl: 'https://placehold.co/800x600/0ea5e9/ffffff.png?text=Hydration+Bundle'
    });
  }

  // ---- 5. Daily Wellness Bundle (configurable, admin-curated) --------------
  {
    function rule(nameEn, brandName, minQuantity, maxQuantity) {
      const product = findProduct(nameEn, brandName ? brandByName[brandName]._id : undefined);
      const variant = defaultVariant(product._id);
      return { variant: variant._id, minQuantity, maxQuantity };
    }

    const items = [
      rule('Multivitamin Daily', 'VitaCore', 1, 2),
      rule('Vitamin D3 5000 IU', 'VitaCore', 0, 2),
      rule('Magnesium Glycinate', 'PureVital', 0, 2),
      rule('Omega-3 Fish Oil', 'VitaCore', 0, 2)
    ];

    bundles.push({
      _id: new mongoose.Types.ObjectId(),
      nameEn: 'Daily Wellness Bundle', nameAr: 'باقة العافية اليومية',
      slug: uniqueSlug('Daily Wellness Bundle'),
      bundleType: 'configurable',
      seller: null, // platform-curated, not tied to one seller
      items,
      minItems: 2,
      maxItems: 6,
      discountType: 'percentage',
      discountValue: 10,
      isActive: true,
      imageUrl: 'https://placehold.co/800x600/7c3aed/ffffff.png?text=Daily+Wellness+Bundle'
    });
  }

  return { bundles };
}

module.exports = { generateBundles };
