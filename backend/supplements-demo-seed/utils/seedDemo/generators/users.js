const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

// Matches controllers/auth.controller.js SALT_ROUNDS exactly so seeded
// password hashes are indistinguishable from ones created through /api/auth/register.
const SALT_ROUNDS = 10;

const SELLERS = [
  {
    fullName: 'Ahmed Farouk',
    email: 'seller.ironcore@supplements.test',
    phone: '+201001112233',
    storeName: 'IronCore Nutrition',
    description:
      'Sports-nutrition specialist focused on whey and mass-gain lines, sourced and lab-tested locally in Egypt.',
    contactPhone: '+201001112233',
    status: 'active'
  },
  {
    fullName: 'Mariam Adel',
    email: 'seller.peakform@supplements.test',
    phone: '+201002223344',
    storeName: 'PeakForm Supplements',
    description: 'Performance and pre-workout formulas for competitive lifters and endurance athletes.',
    contactPhone: '+201002223344',
    status: 'active'
  },
  {
    fullName: 'Youssef Nabil',
    email: 'seller.purevital@supplements.test',
    phone: '+201003334455',
    storeName: 'PureVital Wellness',
    description: 'Everyday vitamins, minerals and hydration products for general health and recovery.',
    contactPhone: '+201003334455',
    status: 'active'
  }
];

const CUSTOMER_NAMES = [
  'Omar Khaled', 'Nourhan Sami', 'Karim Hassan', 'Salma Tarek', 'Mostafa Ali',
  'Yasmin Gaber', 'Hossam Ezzat', 'Rana Mahmoud', 'Amr Fathy', 'Dina Wael',
  'Sherif Adly', 'Aya Ibrahim', 'Tamer Rashad', 'Nada Fouad'
];

/**
 * Builds the full user graph (admin + sellers + seller profiles + customers)
 * with pre-generated ObjectIds so downstream generators (products, orders,
 * reviews...) can reference them before anything is inserted into MongoDB.
 */
async function generateUsers() {
  const adminPasswordHash = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const sellerPasswordHash = await bcrypt.hash('Seller123!', SALT_ROUNDS);
  const customerPasswordHash = await bcrypt.hash('Customer123!', SALT_ROUNDS);

  const admin = {
    _id: new mongoose.Types.ObjectId(),
    fullName: 'Store Admin',
    email: 'admin@supplements.test',
    phone: '+201000001111',
    passwordHash: adminPasswordHash,
    role: 'admin',
    preferredLanguage: 'en',
    isActive: true
  };

  const sellers = SELLERS.map((s) => {
    const userId = new mongoose.Types.ObjectId();
    const profileId = new mongoose.Types.ObjectId();
    return {
      user: {
        _id: userId,
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        passwordHash: sellerPasswordHash,
        role: 'seller',
        preferredLanguage: 'en',
        isActive: true
      },
      profile: {
        _id: profileId,
        user: userId,
        storeName: s.storeName,
        slug: slugify(s.storeName, { lower: true, strict: true }),
        description: s.description,
        logoUrl: `https://placehold.co/200x200/1f2937/ffffff.png?text=${encodeURIComponent(
          s.storeName.split(' ')[0]
        )}`,
        contactPhone: s.contactPhone,
        status: s.status
      }
    };
  });

  const customers = CUSTOMER_NAMES.map((fullName, i) => {
    const slugPart = fullName.toLowerCase().replace(/\s+/g, '.');
    return {
      _id: new mongoose.Types.ObjectId(),
      fullName,
      email: `${slugPart}@customer-demo.test`,
      phone: `+2010${String(4000000 + i * 7).padStart(7, '0')}`,
      passwordHash: customerPasswordHash,
      role: 'customer',
      preferredLanguage: i % 5 === 0 ? 'ar' : 'en',
      isActive: true
    };
  });

  const credentials = {
    admin: { email: admin.email, password: 'Admin123!' },
    sellers: sellers.map((s) => ({ email: s.user.email, password: 'Seller123!', storeName: s.profile.storeName })),
    // one representative customer login is enough for a demo walkthrough
    sampleCustomer: { email: customers[0].email, password: 'Customer123!' }
  };

  return { admin, sellers, customers, credentials };
}

module.exports = { generateUsers, SELLERS, CUSTOMER_NAMES };
