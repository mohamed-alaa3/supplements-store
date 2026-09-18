const mongoose = require('mongoose');
const slugify = require('slugify');

const BRANDS = [
  { name: 'IronCore', country: 'EG', description: 'Whey and mass-gain protein specialist.' },
  { name: 'PeakForm', country: 'EG', description: 'Pre-workout and performance formulas.' },
  { name: 'PureVital', country: 'EG', description: 'Everyday vitamins and minerals.' },
  { name: 'FlexPro Nutrition', country: 'US', description: 'Premium isolate and casein proteins.' },
  { name: 'TitanFuel', country: 'US', description: 'Creatine and strength-focused supplements.' },
  { name: 'HydraCharge', country: 'EG', description: 'Electrolyte and hydration formulas.' },
  { name: 'VitaCore', country: 'DE', description: 'Clinically-dosed vitamin and mineral lines.' },
  { name: 'AminoLab', country: 'US', description: 'BCAA, EAA and recovery amino blends.' },
  { name: 'SnackFit', country: 'EG', description: 'High-protein bars, cookies and snacks.' },
  { name: 'GymGear Pro', country: 'CN', description: 'Shakers and training accessories.' },
  { name: 'NitroBlast', country: 'US', description: 'High-stimulant pre-workout and pump formulas.' },
  { name: 'DailyBalance', country: 'EG', description: 'Affordable everyday wellness supplements.' }
];

const CATEGORIES = [
  { nameEn: 'Whey Protein', nameAr: 'بروتين واي', sortOrder: 1 },
  { nameEn: 'Weight Gainer', nameAr: 'ويت جينر', sortOrder: 2 },
  { nameEn: 'Creatine', nameAr: 'كرياتين', sortOrder: 3 },
  { nameEn: 'Energy & Performance', nameAr: 'الطاقة والأداء', sortOrder: 4 },
  { nameEn: 'Amino Acids', nameAr: 'الأحماض الأمينية', sortOrder: 5 },
  { nameEn: 'Hydration & Energy', nameAr: 'الترطيب والطاقة', sortOrder: 6 },
  { nameEn: 'Vitamins', nameAr: 'فيتامينات', sortOrder: 7 },
  { nameEn: 'Minerals', nameAr: 'معادن', sortOrder: 8 },
  { nameEn: 'Healthy Snacks', nameAr: 'وجبات خفيفة صحية', sortOrder: 9 },
  { nameEn: 'Accessories', nameAr: 'إكسسوارات', sortOrder: 10 }
];

function generateCatalog() {
  const brands = BRANDS.map((b) => {
    const slug = slugify(b.name, { lower: true, strict: true });
    return {
      _id: new mongoose.Types.ObjectId(),
      name: b.name,
      slug,
      description: b.description,
      logoUrl: `https://placehold.co/300x150/0f172a/ffffff.png?text=${encodeURIComponent(b.name)}`,
      country: b.country,
      isActive: true
    };
  });

  const categories = CATEGORIES.map((c) => {
    const slug = slugify(c.nameEn, { lower: true, strict: true });
    return {
      _id: new mongoose.Types.ObjectId(),
      nameAr: c.nameAr,
      nameEn: c.nameEn,
      slug,
      parent: null,
      imageUrl: `https://placehold.co/600x400/16a34a/ffffff.png?text=${encodeURIComponent(c.nameEn)}`,
      isActive: true,
      sortOrder: c.sortOrder
    };
  });

  // Convenience lookup maps so products.js can grab "the Whey Protein category" by name.
  const brandByName = Object.fromEntries(brands.map((b) => [b.name, b]));
  const categoryByName = Object.fromEntries(categories.map((c) => [c.nameEn, c]));

  return { brands, categories, brandByName, categoryByName };
}

module.exports = { generateCatalog, BRANDS, CATEGORIES };
