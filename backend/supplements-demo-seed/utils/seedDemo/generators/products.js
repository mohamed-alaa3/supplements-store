const mongoose = require('mongoose');
const slugify = require('slugify');
const { randomInt, chance } = require('../rng');

/**
 * Each entry describes one Product plus the variants it should get.
 * `variants` entries are combined with `basePrice` via `priceMultiplier`
 * (defaults to 1) to produce ProductVariant.price. The first variant is
 * always the default/cheapest reference variant.
 *
 * category / brand are looked up by name against catalog.js's output, so
 * renaming a category there only requires updating one place.
 */
const BLUEPRINTS = [
  // ---------------------------------------------------------------- Whey Protein
  {
    nameEn: 'Whey Power Protein', nameAr: 'واي باور بروتين', category: 'Whey Protein', brand: 'IronCore',
    productType: 'protein', basePrice: 1450, tags: ['whey', 'protein', 'muscle'], featured: true, bestSeller: true,
    sale: { compareMultiplier: 1.15 }, productDiscount: { type: 'percentage', value: 10 },
    variants: [
      { flavor: 'Chocolate', sizeLabel: '1kg', servings: 33, weightGrams: 1000 },
      { flavor: 'Chocolate', sizeLabel: '2kg', servings: 66, weightGrams: 2000, priceMultiplier: 1.85 },
      { flavor: 'Vanilla', sizeLabel: '1kg', servings: 33, weightGrams: 1000 },
      { flavor: 'Vanilla', sizeLabel: '2kg', servings: 66, weightGrams: 2000, priceMultiplier: 1.85 }
    ]
  },
  {
    nameEn: 'Whey Isolate Pro', nameAr: 'واي أيزوليت برو', category: 'Whey Protein', brand: 'IronCore',
    productType: 'protein', basePrice: 1950, tags: ['whey', 'isolate', 'low-carb'], bestSeller: true,
    variants: [
      { flavor: 'Chocolate', sizeLabel: '900g', servings: 30, weightGrams: 900 },
      { flavor: 'Cookies & Cream', sizeLabel: '900g', servings: 30, weightGrams: 900 }
    ]
  },
  {
    nameEn: 'Gold Isolate', nameAr: 'جولد أيزوليت', category: 'Whey Protein', brand: 'FlexPro Nutrition',
    productType: 'protein', basePrice: 2350, tags: ['whey', 'isolate', 'premium'], featured: true,
    sale: { compareMultiplier: 1.2 }, productDiscount: { type: 'percentage', value: 15 },
    variants: [
      { flavor: 'Double Chocolate', sizeLabel: '900g', servings: 30, weightGrams: 900 },
      { flavor: 'Strawberry Cream', sizeLabel: '900g', servings: 30, weightGrams: 900 },
      { flavor: 'Double Chocolate', sizeLabel: '1.8kg', servings: 60, weightGrams: 1800, priceMultiplier: 1.9 }
    ]
  },
  {
    nameEn: 'Casein Night Recovery', nameAr: 'كازين نايت ريكفري', category: 'Whey Protein', brand: 'FlexPro Nutrition',
    productType: 'protein', basePrice: 2100, tags: ['casein', 'slow-release', 'night'],
    variants: [
      { flavor: 'Vanilla', sizeLabel: '900g', servings: 30, weightGrams: 900 },
      { flavor: 'Chocolate', sizeLabel: '900g', servings: 30, weightGrams: 900 }
    ]
  },
  {
    nameEn: 'Whey Starter', nameAr: 'واي ستارتر', category: 'Whey Protein', brand: 'DailyBalance',
    productType: 'protein', basePrice: 890, tags: ['whey', 'budget', 'beginner'],
    variants: [
      { flavor: 'Chocolate', sizeLabel: '1kg', servings: 33, weightGrams: 1000 },
      { flavor: 'Vanilla', sizeLabel: '1kg', servings: 33, weightGrams: 1000 }
    ]
  },
  {
    nameEn: 'Whey Blend 80', nameAr: 'واي بلند 80', category: 'Whey Protein', brand: 'TitanFuel',
    productType: 'protein', basePrice: 1320, tags: ['whey', 'blend'],
    variants: [
      { flavor: 'Chocolate', sizeLabel: '2kg', servings: 66, weightGrams: 2000 },
      { flavor: 'Banana', sizeLabel: '2kg', servings: 66, weightGrams: 2000 }
    ]
  },

  // -------------------------------------------------------------- Weight Gainer
  {
    nameEn: 'Mass Gainer XXL', nameAr: 'ماس جينر إكس إكس إل', category: 'Weight Gainer', brand: 'IronCore',
    productType: 'protein', basePrice: 1750, tags: ['gainer', 'bulk', 'calories'], bestSeller: true,
    variants: [
      { flavor: 'Chocolate', sizeLabel: '3kg', servings: 20, weightGrams: 3000 },
      { flavor: 'Chocolate', sizeLabel: '6kg', servings: 40, weightGrams: 6000, priceMultiplier: 1.9 },
      { flavor: 'Vanilla', sizeLabel: '3kg', servings: 20, weightGrams: 3000 }
    ]
  },
  {
    nameEn: 'Serious Gainer', nameAr: 'سيريوس جينر', category: 'Weight Gainer', brand: 'FlexPro Nutrition',
    productType: 'protein', basePrice: 2050, tags: ['gainer', 'high-calorie'], featured: true,
    sale: { compareMultiplier: 1.18 }, productDiscount: { type: 'fixed', value: 150 },
    variants: [
      { flavor: 'Chocolate Peanut Butter', sizeLabel: '4.5kg', servings: 30, weightGrams: 4500 },
      { flavor: 'Vanilla', sizeLabel: '4.5kg', servings: 30, weightGrams: 4500 }
    ]
  },
  {
    nameEn: 'Gainer Basic', nameAr: 'جينر بيسك', category: 'Weight Gainer', brand: 'DailyBalance',
    productType: 'protein', basePrice: 980, tags: ['gainer', 'budget'],
    variants: [{ flavor: 'Chocolate', sizeLabel: '3kg', servings: 20, weightGrams: 3000 }]
  },

  // -------------------------------------------------------------------- Creatine
  {
    nameEn: 'Creatine Monohydrate', nameAr: 'كرياتين مونوهيدرات', category: 'Creatine', brand: 'TitanFuel',
    productType: 'supplement', basePrice: 650, tags: ['creatine', 'strength'], featured: true, bestSeller: true,
    variants: [
      { flavor: 'Unflavored', sizeLabel: '300g', servings: 60, weightGrams: 300 },
      { flavor: 'Unflavored', sizeLabel: '500g', servings: 100, weightGrams: 500, priceMultiplier: 1.55 }
    ]
  },
  {
    nameEn: 'Creatine HCL', nameAr: 'كرياتين إتش سي إل', category: 'Creatine', brand: 'TitanFuel',
    productType: 'supplement', basePrice: 850, tags: ['creatine', 'hcl', 'no-bloat'],
    variants: [{ flavor: 'Unflavored', sizeLabel: '250g', servings: 83, weightGrams: 250 }]
  },
  {
    nameEn: 'Creatine Monohydrate', nameAr: 'كرياتين مونوهيدرات', category: 'Creatine', brand: 'IronCore',
    productType: 'supplement', basePrice: 480, tags: ['creatine', 'budget'],
    variants: [{ flavor: 'Unflavored', sizeLabel: '300g', servings: 60, weightGrams: 300 }]
  },
  {
    nameEn: 'Creatine Gummies', nameAr: 'كرياتين جامي', category: 'Creatine', brand: 'NitroBlast',
    productType: 'supplement', basePrice: 590, tags: ['creatine', 'gummies', 'convenient'],
    variants: [{ flavor: 'Mixed Berry', sizeLabel: '60 gummies', servings: 30 }]
  },

  // ----------------------------------------------------- Energy & Performance
  {
    nameEn: 'Pre-Workout Ignite', nameAr: 'بري ووركاوت إيجنايت', category: 'Energy & Performance', brand: 'PeakForm',
    productType: 'preworkout', basePrice: 1150, tags: ['pre-workout', 'energy', 'pump'], featured: true, bestSeller: true,
    sale: { compareMultiplier: 1.2 }, productDiscount: { type: 'percentage', value: 15 },
    variants: [
      { flavor: 'Fruit Punch', sizeLabel: '300g', servings: 30, weightGrams: 300 },
      { flavor: 'Blue Raspberry', sizeLabel: '300g', servings: 30, weightGrams: 300 },
      { flavor: 'Orange', sizeLabel: '300g', servings: 30, weightGrams: 300 }
    ]
  },
  {
    nameEn: 'Pump Surge', nameAr: 'بامب سيرج', category: 'Energy & Performance', brand: 'NitroBlast',
    productType: 'preworkout', basePrice: 1280, tags: ['pre-workout', 'pump', 'stim-free'], bestSeller: true,
    variants: [
      { flavor: 'Watermelon', sizeLabel: '270g', servings: 30, weightGrams: 270 },
      { flavor: 'Green Apple', sizeLabel: '270g', servings: 30, weightGrams: 270 }
    ]
  },
  {
    nameEn: 'Pre-Workout Zero Stim', nameAr: 'بري ووركاوت زيرو ستيم', category: 'Energy & Performance', brand: 'PeakForm',
    productType: 'preworkout', basePrice: 990, tags: ['pre-workout', 'caffeine-free'],
    variants: [{ flavor: 'Orange Mango', sizeLabel: '300g', servings: 30, weightGrams: 300 }]
  },
  {
    nameEn: 'Focus Pre-Workout', nameAr: 'فوكس بري ووركاوت', category: 'Energy & Performance', brand: 'NitroBlast',
    productType: 'preworkout', basePrice: 1350, tags: ['pre-workout', 'focus', 'nootropic'], featured: true,
    sale: { compareMultiplier: 1.15 }, productDiscount: { type: 'percentage', value: 10 },
    variants: [{ flavor: 'Blue Raspberry', sizeLabel: '300g', servings: 30, weightGrams: 300 }]
  },
  {
    nameEn: 'Pump Pre-Workout', nameAr: 'بامب بري ووركاوت', category: 'Energy & Performance', brand: 'TitanFuel',
    productType: 'preworkout', basePrice: 1080, tags: ['pre-workout', 'citrulline'],
    variants: [{ flavor: 'Fruit Punch', sizeLabel: '300g', servings: 30, weightGrams: 300 }]
  },

  // --------------------------------------------------------------- Amino Acids
  {
    nameEn: 'BCAA 2:1:1', nameAr: 'بي سي إيه إيه 2:1:1', category: 'Amino Acids', brand: 'AminoLab',
    productType: 'amino', basePrice: 780, tags: ['bcaa', 'recovery'], bestSeller: true,
    variants: [
      { flavor: 'Watermelon', sizeLabel: '400g', servings: 40, weightGrams: 400 },
      { flavor: 'Green Apple', sizeLabel: '400g', servings: 40, weightGrams: 400 }
    ]
  },
  {
    nameEn: 'EAA Complete', nameAr: 'إي إيه إيه كومبليت', category: 'Amino Acids', brand: 'AminoLab',
    productType: 'amino', basePrice: 920, tags: ['eaa', 'recovery', 'hydration'], featured: true,
    variants: [
      { flavor: 'Blue Raspberry', sizeLabel: '450g', servings: 30, weightGrams: 450 },
      { flavor: 'Lemonade', sizeLabel: '450g', servings: 30, weightGrams: 450 }
    ]
  },
  {
    nameEn: 'Beta Alanine', nameAr: 'بيتا ألانين', category: 'Amino Acids', brand: 'PeakForm',
    productType: 'amino', basePrice: 560, tags: ['beta-alanine', 'endurance'],
    variants: [{ flavor: 'Unflavored', sizeLabel: '250g', servings: 83, weightGrams: 250 }]
  },
  {
    nameEn: 'Recovery Aminos', nameAr: 'ريكفري أمينوز', category: 'Amino Acids', brand: 'TitanFuel',
    productType: 'amino', basePrice: 870, tags: ['amino', 'recovery'],
    sale: { compareMultiplier: 1.15 }, productDiscount: { type: 'fixed', value: 60 },
    variants: [{ flavor: 'Mixed Berry', sizeLabel: '400g', servings: 40, weightGrams: 400 }]
  },

  // ---------------------------------------------------------- Hydration & Energy
  {
    nameEn: 'Electrolyte Powder', nameAr: 'مسحوق إلكتروليت', category: 'Hydration & Energy', brand: 'HydraCharge',
    productType: 'hydration', basePrice: 520, tags: ['electrolytes', 'hydration'], featured: true, bestSeller: true,
    variants: [
      { flavor: 'Lemon Lime', sizeLabel: '20 servings', servings: 20 },
      { flavor: 'Orange', sizeLabel: '20 servings', servings: 20 },
      { flavor: 'Mixed Berry', sizeLabel: '20 servings', servings: 20 }
    ]
  },
  {
    nameEn: 'Hydration Tablets', nameAr: 'أقراص ترطيب', category: 'Hydration & Energy', brand: 'HydraCharge',
    productType: 'hydration', basePrice: 380, tags: ['electrolytes', 'tablets', 'travel'],
    variants: [{ flavor: 'Citrus', sizeLabel: '20 tablets', servings: 20 }]
  },
  {
    nameEn: 'Energy Hydration Mix', nameAr: 'خليط طاقة وترطيب', category: 'Hydration & Energy', brand: 'DailyBalance',
    productType: 'hydration', basePrice: 340, tags: ['hydration', 'energy', 'budget'],
    variants: [{ flavor: 'Tropical', sizeLabel: '15 servings', servings: 15 }]
  },
  {
    nameEn: 'Electrolyte Sport Drink Mix', nameAr: 'خليط مشروب رياضي', category: 'Hydration & Energy', brand: 'PeakForm',
    productType: 'hydration', basePrice: 460, tags: ['hydration', 'sport-drink'],
    sale: { compareMultiplier: 1.15 }, productDiscount: { type: 'percentage', value: 10 },
    variants: [
      { flavor: 'Blue Raspberry', sizeLabel: '20 servings', servings: 20 },
      { flavor: 'Fruit Punch', sizeLabel: '20 servings', servings: 20 }
    ]
  },

  // ---------------------------------------------------------------------- Vitamins
  {
    nameEn: 'Multivitamin Daily', nameAr: 'ملتي فيتامين يومي', category: 'Vitamins', brand: 'VitaCore',
    productType: 'vitamin', basePrice: 420, tags: ['multivitamin', 'daily'], bestSeller: true,
    variants: [{ sizeLabel: '60 tablets', servings: 60 }, { sizeLabel: '120 tablets', servings: 120, priceMultiplier: 1.8 }]
  },
  {
    nameEn: 'Vitamin D3 5000 IU', nameAr: 'فيتامين د3 5000 وحدة', category: 'Vitamins', brand: 'VitaCore',
    productType: 'vitamin', basePrice: 290, tags: ['vitamin-d', 'immunity'], featured: true,
    variants: [{ sizeLabel: '90 softgels', servings: 90 }]
  },
  {
    nameEn: 'Vitamin C 1000mg', nameAr: 'فيتامين سي 1000 مجم', category: 'Vitamins', brand: 'PureVital',
    productType: 'vitamin', basePrice: 260, tags: ['vitamin-c', 'immunity'],
    variants: [{ sizeLabel: '100 tablets', servings: 100 }]
  },
  {
    nameEn: "Multivitamin for Women", nameAr: 'ملتي فيتامين للسيدات', category: 'Vitamins', brand: 'PureVital',
    productType: 'vitamin', basePrice: 450, tags: ['multivitamin', 'women'],
    sale: { compareMultiplier: 1.2 }, productDiscount: { type: 'percentage', value: 15 },
    variants: [{ sizeLabel: '60 capsules', servings: 60 }]
  },
  {
    nameEn: 'Multivitamin for Men', nameAr: 'ملتي فيتامين للرجال', category: 'Vitamins', brand: 'PureVital',
    productType: 'vitamin', basePrice: 450, tags: ['multivitamin', 'men'], featured: true,
    variants: [{ sizeLabel: '60 capsules', servings: 60 }]
  },
  {
    nameEn: 'Omega-3 Fish Oil', nameAr: 'أوميجا 3 زيت سمك', category: 'Vitamins', brand: 'VitaCore',
    productType: 'vitamin', basePrice: 480, tags: ['omega-3', 'heart-health'], bestSeller: true,
    variants: [{ sizeLabel: '90 softgels', servings: 90 }]
  },
  {
    nameEn: 'Vitamin B-Complex', nameAr: 'فيتامين بي كومبلكس', category: 'Vitamins', brand: 'VitaCore',
    productType: 'vitamin', basePrice: 310, tags: ['vitamin-b', 'energy'],
    variants: [{ sizeLabel: '60 tablets', servings: 60 }]
  },
  {
    nameEn: 'Kids Multivitamin Gummies', nameAr: 'ملتي فيتامين جامي للأطفال', category: 'Vitamins', brand: 'DailyBalance',
    productType: 'vitamin', basePrice: 350, tags: ['kids', 'gummies'],
    variants: [{ flavor: 'Mixed Fruit', sizeLabel: '60 gummies', servings: 30 }]
  },

  // ----------------------------------------------------------------------- Minerals
  {
    nameEn: 'Magnesium Glycinate', nameAr: 'ماغنسيوم جليسينات', category: 'Minerals', brand: 'PureVital',
    productType: 'mineral', basePrice: 340, tags: ['magnesium', 'sleep', 'recovery'], featured: true,
    variants: [{ sizeLabel: '90 capsules', servings: 90 }]
  },
  {
    nameEn: 'Zinc + Vitamin C', nameAr: 'زنك + فيتامين سي', category: 'Minerals', brand: 'PureVital',
    productType: 'mineral', basePrice: 220, tags: ['zinc', 'immunity'], bestSeller: true,
    variants: [{ sizeLabel: '90 tablets', servings: 90 }]
  },
  {
    nameEn: 'Calcium + Vitamin D', nameAr: 'كالسيوم + فيتامين د', category: 'Minerals', brand: 'VitaCore',
    productType: 'mineral', basePrice: 300, tags: ['calcium', 'bone-health'],
    variants: [{ sizeLabel: '90 tablets', servings: 90 }]
  },
  {
    nameEn: 'Iron Complex', nameAr: 'مركب الحديد', category: 'Minerals', brand: 'DailyBalance',
    productType: 'mineral', basePrice: 240, tags: ['iron', 'energy'],
    variants: [{ sizeLabel: '60 tablets', servings: 60 }]
  },
  {
    nameEn: 'Potassium + Electrolytes', nameAr: 'بوتاسيوم + إلكتروليت', category: 'Minerals', brand: 'PureVital',
    productType: 'mineral', basePrice: 260, tags: ['potassium', 'electrolytes'],
    sale: { compareMultiplier: 1.15 }, productDiscount: { type: 'fixed', value: 30 },
    variants: [{ sizeLabel: '90 capsules', servings: 90 }]
  },

  // ------------------------------------------------------------------- Healthy Snacks
  {
    nameEn: 'Protein Bar', nameAr: 'بروتين بار', category: 'Healthy Snacks', brand: 'SnackFit',
    productType: 'snack', basePrice: 65, tags: ['protein-bar', 'snack'], bestSeller: true,
    variants: [
      { flavor: 'Chocolate Brownie', sizeLabel: 'Single 60g', weightGrams: 60 },
      { flavor: 'Peanut Butter', sizeLabel: 'Single 60g', weightGrams: 60 },
      { flavor: 'Chocolate Brownie', sizeLabel: 'Box of 12', weightGrams: 720, priceMultiplier: 10.5 }
    ]
  },
  {
    nameEn: 'Protein Cookies', nameAr: 'كوكيز بروتين', category: 'Healthy Snacks', brand: 'SnackFit',
    productType: 'snack', basePrice: 75, tags: ['protein-cookie', 'snack'],
    variants: [
      { flavor: 'Double Chocolate', sizeLabel: 'Single 70g', weightGrams: 70 },
      { flavor: 'Chocolate Chip', sizeLabel: 'Box of 10', weightGrams: 700, priceMultiplier: 8.5 }
    ]
  },
  {
    nameEn: 'Protein Chips', nameAr: 'شيبس بروتين', category: 'Healthy Snacks', brand: 'SnackFit',
    productType: 'snack', basePrice: 55, tags: ['protein-chips', 'savory'],
    variants: [{ flavor: 'Sour Cream & Onion', sizeLabel: 'Single 30g', weightGrams: 30 }]
  },
  {
    nameEn: 'Granola Protein Bites', nameAr: 'حبيبات جرانولا بروتين', category: 'Healthy Snacks', brand: 'DailyBalance',
    productType: 'snack', basePrice: 45, tags: ['granola', 'budget', 'snack'],
    variants: [{ flavor: 'Honey Oat', sizeLabel: 'Pack of 6', weightGrams: 180 }]
  },
  {
    nameEn: 'Protein Popcorn', nameAr: 'فشار بروتين', category: 'Healthy Snacks', brand: 'AminoLab',
    productType: 'snack', basePrice: 60, tags: ['popcorn', 'snack', 'savory'],
    variants: [{ flavor: 'Cheddar', sizeLabel: 'Single 40g', weightGrams: 40 }]
  },

  // -------------------------------------------------------------------- Accessories
  {
    nameEn: 'Shaker Bottle 700ml', nameAr: 'شيكر 700 مل', category: 'Accessories', brand: 'GymGear Pro',
    productType: 'equipment', basePrice: 180, tags: ['shaker', 'accessory'], bestSeller: true,
    variants: [
      { sizeLabel: 'Black' }, { sizeLabel: 'Blue' }, { sizeLabel: 'Pink' }
    ]
  },
  {
    nameEn: 'Gym Gloves', nameAr: 'قفازات جيم', category: 'Accessories', brand: 'GymGear Pro',
    productType: 'equipment', basePrice: 260, tags: ['gloves', 'training'],
    variants: [{ sizeLabel: 'Medium' }, { sizeLabel: 'Large' }]
  },
  {
    nameEn: 'Lifting Straps', nameAr: 'أحزمة رفع', category: 'Accessories', brand: 'GymGear Pro',
    productType: 'equipment', basePrice: 220, tags: ['straps', 'lifting'],
    variants: [{ sizeLabel: 'One Size' }]
  },
  {
    nameEn: 'Resistance Bands Set', nameAr: 'مجموعة حبال مقاومة', category: 'Accessories', brand: 'GymGear Pro',
    productType: 'equipment', basePrice: 340, tags: ['resistance-bands', 'home-workout'], featured: true,
    sale: { compareMultiplier: 1.2 }, productDiscount: { type: 'percentage', value: 12 },
    variants: [{ sizeLabel: 'Set of 5' }]
  },
  {
    nameEn: 'Foam Roller', nameAr: 'أسطوانة تدليك', category: 'Accessories', brand: 'GymGear Pro',
    productType: 'equipment', basePrice: 390, tags: ['recovery', 'mobility'],
    variants: [{ sizeLabel: '45cm' }, { sizeLabel: '90cm', priceMultiplier: 1.6 }]
  },
  {
    nameEn: 'Weightlifting Belt', nameAr: 'حزام رفع أثقال', category: 'Accessories', brand: 'GymGear Pro',
    productType: 'equipment', basePrice: 480, tags: ['belt', 'strength'],
    variants: [{ sizeLabel: 'Medium' }, { sizeLabel: 'Large' }, { sizeLabel: 'X-Large' }]
  }
];

function shortCode(name) {
  return slugify(name, { lower: true, strict: true }).slice(0, 3).toUpperCase() || 'GEN';
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Builds Products + ProductVariants + ProductImages from BLUEPRINTS, round-
 * robins each product across the three sellers, and assigns
 * featured/best-seller flags either from the blueprint or a light random
 * sprinkle so the "featured=true" / "bestSeller=true" API filters return a
 * believable subset either way.
 */
function generateProducts({ categoryByName, brandByName, sellers }) {
  const usedSlugs = new Set();
  const products = [];
  const variants = [];
  const images = [];

  BLUEPRINTS.forEach((bp, index) => {
    const category = categoryByName[bp.category];
    const brand = brandByName[bp.brand];
    if (!category) throw new Error(`Unknown category "${bp.category}" for product "${bp.nameEn}"`);
    if (!brand) throw new Error(`Unknown brand "${bp.brand}" for product "${bp.nameEn}"`);

    const seller = sellers[index % sellers.length].profile;

    let baseSlug = slugify(bp.nameEn, { lower: true, strict: true });
    let slug = baseSlug;
    let dupeCounter = 1;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${dupeCounter}`;
      dupeCounter += 1;
    }
    usedSlugs.add(slug);

    const productId = new mongoose.Types.ObjectId();
    const brandCode = shortCode(brand.name);
    const productNumber = String(index + 1).padStart(3, '0');

    // ---- Variants -----------------------------------------------------
    const productVariants = bp.variants.map((v, vIndex) => {
      const letter = String.fromCharCode(65 + vIndex); // A, B, C...
      const multiplier = v.priceMultiplier || 1;
      const price = round2(bp.basePrice * multiplier);
      const compareAtPrice = bp.sale ? round2(price * bp.sale.compareMultiplier) : undefined;
      const nameSuffix = [v.flavor, v.sizeLabel].filter(Boolean).join(' / ');

      return {
        _id: new mongoose.Types.ObjectId(),
        product: productId,
        sku: `${brandCode}-${productNumber}${letter}`,
        nameEn: nameSuffix ? `${bp.nameEn} - ${nameSuffix}` : bp.nameEn,
        nameAr: nameSuffix ? `${bp.nameAr} - ${nameSuffix}` : bp.nameAr,
        flavor: v.flavor,
        sizeLabel: v.sizeLabel,
        servings: v.servings,
        price,
        compareAtPrice,
        barcode: `622${productNumber}${letter}${randomInt(1000, 9999)}`,
        weightGrams: v.weightGrams,
        isDefault: vIndex === 0,
        isActive: true
      };
    });
    variants.push(...productVariants);

    const defaultVariant = productVariants[0];

    // ---- Product --------------------------------------------------------
    const discount = bp.productDiscount || null;
    const product = {
      _id: productId,
      nameAr: bp.nameAr,
      nameEn: bp.nameEn,
      slug,
      shortDescriptionAr: `${bp.nameAr} من ${brand.name} — جودة موثوقة لدعم أهدافك الرياضية.`,
      shortDescriptionEn: `${bp.nameEn} by ${brand.name} — trusted quality to support your training goals.`,
      descriptionAr:
        `${bp.nameAr} منتج من ${brand.name} ضمن فئة ${category.nameAr}. ` +
        `مناسب للاستخدام اليومي كجزء من نظام غذائي متوازن وبرنامج تدريبي منتظم.`,
      descriptionEn:
        `${bp.nameEn} is produced by ${brand.name} in the ${category.nameEn} range. ` +
        `Formulated for everyday use alongside a balanced diet and regular training program.`,
      seller: seller._id,
      brand: brand._id,
      category: category._id,
      productType: bp.productType,
      basePrice: defaultVariant.price,
      compareAtPrice: defaultVariant.compareAtPrice,
      discountType: discount ? discount.type : 'none',
      discountValue: discount ? discount.value : 0,
      ratingAverage: 0, // recomputed from seeded reviews in reviews.js
      reviewCount: 0,
      tags: bp.tags || [],
      isFeatured: !!bp.featured,
      isBestSeller: !!bp.bestSeller,
      isActive: true
    };
    products.push(product);

    // ---- Images ---------------------------------------------------------
    const primaryColor = bp.sale ? 'dc2626' : '0ea5e9';
    images.push({
      _id: new mongoose.Types.ObjectId(),
      product: productId,
      variant: null,
      url: `https://placehold.co/800x800/${primaryColor}/ffffff.png?text=${encodeURIComponent(bp.nameEn)}`,
      altAr: bp.nameAr,
      altEn: bp.nameEn,
      sortOrder: 0,
      isPrimary: true
    });

    if (bp.featured || bp.bestSeller || chance(0.4)) {
      images.push({
        _id: new mongoose.Types.ObjectId(),
        product: productId,
        variant: null,
        url: `https://placehold.co/800x800/1e293b/ffffff.png?text=${encodeURIComponent(`${bp.nameEn} - Nutrition Facts`)}`,
        altAr: `${bp.nameAr} - القيمة الغذائية`,
        altEn: `${bp.nameEn} - Nutrition Facts`,
        sortOrder: 1,
        isPrimary: false
      });
    }
  });

  return { products, variants, images };
}

module.exports = { generateProducts, BLUEPRINTS };
