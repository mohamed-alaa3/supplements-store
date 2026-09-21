const mongoose = require('mongoose');
const { pickMany, randomInt, chance } = require('../rng');

/** Carts are optional/in-progress state, so only a subset of customers get one — mirrors real usage. */
function generateCarts(customers, variants, coupons) {
  const carts = [];
  const cartCustomers = pickMany(customers, Math.round(customers.length * 0.4));

  cartCustomers.forEach((customer) => {
    const itemCount = randomInt(1, 3);
    const chosenVariants = pickMany(variants, itemCount);
    carts.push({
      _id: new mongoose.Types.ObjectId(),
      user: customer._id,
      items: chosenVariants.map((v) => ({
        _id: new mongoose.Types.ObjectId(),
        variant: v._id,
        quantity: randomInt(1, 2)
      })),
      coupon: chance(0.2) && coupons.length ? coupons[randomInt(0, coupons.length - 1)]._id : null
    });
  });

  return { carts };
}

module.exports = { generateCarts };
