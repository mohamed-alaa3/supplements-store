const mongoose = require('mongoose');
const { randomInt, pickMany, chance } = require('../rng');

const COMMENTS_BY_RATING = {
  5: [
    'Exactly what I needed — mixes well and tastes great.',
    'Fast results, will definitely reorder.',
    'Best product I have tried in this category so far.',
    'ممتاز جداً وطعمه رائع، هكرره تاني أكيد.',
    'جودة عالية وسعر مناسب، أنصح بيه.'
  ],
  4: [
    'Good quality overall, just wish the container was a bit bigger.',
    'Works well, taste is decent, would buy again.',
    'Solid product, delivery took a couple of extra days.',
    'جيد جداً بس التوصيل اتأخر شوية.',
    'المنتج كويس ومناسب للسعر.'
  ],
  3: [
    'It is okay, does the job but nothing special.',
    'Average taste, effects are noticeable but mild.',
    'متوسط، مش سيء بس مكنتش متوقع أكتر.'
  ],
  2: [
    'Did not dissolve very well, had to shake it a lot.',
    'Taste was too artificial for my liking.',
    'مش عاجبني الطعم بصراحة.'
  ],
  1: [
    'Packaging arrived damaged and the seal was broken.',
    'Did not notice any real difference after weeks of use.'
  ]
};

function ratingDistribution() {
  // Weighted toward positive ratings, like most real storefronts.
  const roll = randomInt(1, 100);
  if (roll <= 45) return 5;
  if (roll <= 75) return 4;
  if (roll <= 90) return 3;
  if (roll <= 97) return 2;
  return 1;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Reviews only a subset of the catalog (real stores rarely have every
 * product reviewed), 2-7 reviews each from distinct customers (schema
 * enforces one review per user+product). Mutates `products` in place to set
 * ratingAverage/reviewCount from the *approved* reviews only, mirroring
 * controllers/review.controller.js#recomputeProductRating exactly.
 */
function generateReviews({ products, customers }) {
  const reviews = [];
  const reviewedProducts = pickMany(products, Math.round(products.length * 0.65));

  for (const product of reviewedProducts) {
    const reviewerCount = randomInt(2, 7);
    const reviewers = pickMany(customers, Math.min(reviewerCount, customers.length));

    const approvedRatings = [];
    for (const customer of reviewers) {
      const rating = ratingDistribution();
      const status = chance(0.92) ? 'approved' : 'pending';
      const comments = COMMENTS_BY_RATING[rating];

      reviews.push({
        _id: new mongoose.Types.ObjectId(),
        user: customer._id,
        product: product._id,
        order: null,
        rating,
        title: undefined,
        comment: comments[randomInt(0, comments.length - 1)],
        status
      });

      if (status === 'approved') approvedRatings.push(rating);
    }

    if (approvedRatings.length) {
      const avg = approvedRatings.reduce((a, b) => a + b, 0) / approvedRatings.length;
      product.ratingAverage = round2(avg);
      product.reviewCount = approvedRatings.length;
    } else {
      product.ratingAverage = 0;
      product.reviewCount = 0;
    }
  }

  return { reviews };
}

module.exports = { generateReviews };
