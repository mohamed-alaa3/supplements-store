const mongoose = require('mongoose');
const { pickMany, randomInt, chance } = require('../rng');

function generateWishlists(customers, products, variants) {
  const wishlists = [];
  const variantsByProduct = new Map();
  variants.forEach((v) => {
    const key = String(v.product);
    if (!variantsByProduct.has(key)) variantsByProduct.set(key, []);
    variantsByProduct.get(key).push(v);
  });

  const wishlistCustomers = pickMany(customers, Math.round(customers.length * 0.35));

  wishlistCustomers.forEach((customer) => {
    const itemCount = randomInt(1, 4);
    const chosenProducts = pickMany(products, itemCount);
    wishlists.push({
      _id: new mongoose.Types.ObjectId(),
      user: customer._id,
      items: chosenProducts.map((product) => {
        const productVariants = variantsByProduct.get(String(product._id)) || [];
        const variant = chance(0.5) && productVariants.length ? productVariants[0]._id : null;
        return { _id: new mongoose.Types.ObjectId(), product: product._id, variant };
      })
    });
  });

  return { wishlists };
}

module.exports = { generateWishlists };
