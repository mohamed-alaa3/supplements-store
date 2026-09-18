const mongoose = require('mongoose');
const { daysFromNow } = require('../rng');

const BANNERS = [
  {
    titleEn: 'Fuel Your Best Season Yet', titleAr: 'زوّد موسمك بأفضل أداء',
    subtitleEn: 'Up to 20% off best-selling protein and performance stacks',
    subtitleAr: 'خصم حتى 20% على أفضل منتجات البروتين والأداء',
    color: '16a34a', sortOrder: 0
  },
  {
    titleEn: 'New Customer? Save 10% Instantly', titleAr: 'عميل جديد؟ وفّر 10% فوراً',
    subtitleEn: 'Use code WELCOME10 at checkout',
    subtitleAr: 'استخدم كود WELCOME10 عند الدفع',
    color: 'f59e0b', sortOrder: 1
  },
  {
    titleEn: 'Free Shipping Over 1500 EGP', titleAr: 'شحن مجاني للطلبات فوق 1500 جنيه',
    subtitleEn: 'No code needed — applied automatically at checkout',
    subtitleAr: 'يتم تطبيقه تلقائياً عند الدفع',
    color: '2563eb', sortOrder: 2
  },
  {
    titleEn: 'Train Harder, Recover Faster', titleAr: 'تمرّن بقوة وتعافَ بسرعة',
    subtitleEn: 'Pre-workout, BCAA and EAA picks for every training style',
    subtitleAr: 'منتجات ما قبل التمرين والأحماض الأمينية لكل أسلوب تدريب',
    color: 'dc2626', sortOrder: 3
  },
  {
    titleEn: 'Protein for Every Goal', titleAr: 'بروتين لكل هدف',
    subtitleEn: 'Whey, isolate, casein and mass gainers from trusted brands',
    subtitleAr: 'واي وأيزوليت وكازين وجينر من ماركات موثوقة',
    color: '7c3aed', sortOrder: 4
  }
];

function generateBanners() {
  return BANNERS.map((b) => ({
    _id: new mongoose.Types.ObjectId(),
    titleAr: b.titleAr,
    titleEn: b.titleEn,
    subtitleAr: b.subtitleAr,
    subtitleEn: b.subtitleEn,
    imageUrl: `https://placehold.co/1600x600/${b.color}/ffffff.png?text=${encodeURIComponent(b.titleEn)}`,
    linkUrl: '/shop',
    sortOrder: b.sortOrder,
    isActive: true,
    startsAt: daysFromNow(-30),
    expiresAt: daysFromNow(60)
  }));
}

module.exports = { generateBanners };
