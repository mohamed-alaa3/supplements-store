const mongoose = require('mongoose');
const slugify = require('slugify');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { parsePagination } = require('../utils/pagination');
const { isValidObjectId } = require('../utils/objectId');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const ProductImage = require('../models/ProductImage');
const Inventory = require('../models/Inventory');
const SellerProfile = require('../models/SellerProfile');

const SORT_MAP = {
  newest: { createdAt: -1 },
  price_asc: { priceFrom: 1 },
  price_desc: { priceFrom: -1 },
  rating: { ratingAverage: -1 },
  popularity: { reviewCount: -1 }
};

/**
 * Shared aggregation: joins each Product with its active variants (for a
 * computed priceFrom) and inventory (for a computed stockState), plus its
 * primary image. This is what makes list/detail responses match the
 * frontend's ProductListItem shape without denormalizing price/stock onto
 * the Product document itself.
 */
function buildProductPipeline(matchStage) {
  return [
    { $match: matchStage },
    {
      $lookup: {
        from: 'productvariants',
        let: { productId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$product', '$$productId'] }, { $eq: ['$isActive', true] }] } } }
        ],
        as: 'variants'
      }
    },
    {
      $lookup: {
        from: 'inventories',
        let: { variantIds: '$variants._id' },
        pipeline: [{ $match: { $expr: { $in: ['$variant', '$$variantIds'] } } }],
        as: 'inventoryRows'
      }
    },
    {
      $lookup: {
        from: 'productimages',
        let: { productId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$product', '$$productId'] }, { $eq: ['$isPrimary', true] }] } } },
          { $limit: 1 }
        ],
        as: 'primaryImage'
      }
    },
    {
      $addFields: {
        priceFrom: { $min: '$variants.price' },
        stockState: {
          $switch: {
            branches: [
              { case: { $in: ['in_stock', '$inventoryRows.status'] }, then: 'in_stock' },
              { case: { $in: ['low_stock', '$inventoryRows.status'] }, then: 'low_stock' }
            ],
            default: 'out_of_stock'
          }
        },
        primaryImageUrl: { $arrayElemAt: ['$primaryImage.url', 0] }
      }
    },
    { $project: { variants: 0, inventoryRows: 0, primaryImage: 0 } }
  ];
}

// GET /api/products
const list = asyncHandler(async (req, res) => {
  const {
    search, category, brand, seller, productType,
    minPrice, maxPrice, minRating, inStock, featured, bestSeller, sort
  } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const match = { isActive: true };
  if (search) match.$text = { $search: search };
  if (category && isValidObjectId(category)) match.category = new mongoose.Types.ObjectId(category);
  if (brand && isValidObjectId(brand)) match.brand = new mongoose.Types.ObjectId(brand);
  if (seller && isValidObjectId(seller)) match.seller = new mongoose.Types.ObjectId(seller);
  if (productType) match.productType = productType;
  if (featured !== undefined) match.isFeatured = featured === 'true';
  if (bestSeller !== undefined) match.isBestSeller = bestSeller === 'true';
  if (minRating !== undefined) match.ratingAverage = { $gte: Number(minRating) };

  const pipeline = buildProductPipeline(match);

  const postFilters = {};
  if (minPrice !== undefined || maxPrice !== undefined) {
    postFilters.priceFrom = {};
    if (minPrice !== undefined) postFilters.priceFrom.$gte = Number(minPrice);
    if (maxPrice !== undefined) postFilters.priceFrom.$lte = Number(maxPrice);
  }
  if (inStock === 'true') postFilters.stockState = { $ne: 'out_of_stock' };
  if (Object.keys(postFilters).length) pipeline.push({ $match: postFilters });

  const sortStage = SORT_MAP[sort] || SORT_MAP.newest;

  const [items, countResult] = await Promise.all([
    Product.aggregate([...pipeline, { $sort: sortStage }, { $skip: skip }, { $limit: limit }]),
    Product.aggregate([...pipeline, { $count: 'total' }])
  ]);

  const totalItems = countResult[0]?.total || 0;
  sendSuccess(res, { data: items, meta: buildMeta({ page, limit, totalItems }) });
});

// GET /api/products/:id
const getById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw ApiError.notFound('Product not found');
  const results = await Product.aggregate(buildProductPipeline({ _id: new mongoose.Types.ObjectId(req.params.id) }));
  if (!results.length) throw ApiError.notFound('Product not found');
  sendSuccess(res, { data: results[0] });
});

// GET /api/products/slug/:slug
const getBySlug = asyncHandler(async (req, res) => {
  const results = await Product.aggregate(buildProductPipeline({ slug: req.params.slug }));
  if (!results.length) throw ApiError.notFound('Product not found');
  sendSuccess(res, { data: results[0] });
});

// GET /api/products/:productId/images
const getImages = asyncHandler(async (req, res) => {
  const images = await ProductImage.find({ product: req.params.productId }).sort({ sortOrder: 1 });
  sendSuccess(res, { data: images });
});

// POST /api/products/:productId/images
const addImage = asyncHandler(async (req, res) => {
  const { url, altAr, altEn, isPrimary, variant } = req.body;
  if (isPrimary) {
    await ProductImage.updateMany({ product: req.params.productId }, { $set: { isPrimary: false } });
  }
  const image = await ProductImage.create({
    product: req.params.productId, variant: variant || null, url, altAr, altEn, isPrimary: !!isPrimary
  });
  sendSuccess(res, { statusCode: 201, data: image, message: 'Image added' });
});

// DELETE /api/products/:productId/images/:imageId
const deleteImage = asyncHandler(async (req, res) => {
  const image = await ProductImage.findOneAndDelete({ _id: req.params.imageId, product: req.params.productId });
  if (!image) throw ApiError.notFound('Image not found');
  sendSuccess(res, { data: null, message: 'Image removed' });
});

// ---- Seller/Admin write operations --------------------------------------------

// POST /api/products (seller or admin)
const create = asyncHandler(async (req, res) => {
  let sellerId = null;

  // Seller-created product → assign it to the seller profile
  if (req.user.role === "seller") {
    const profile = await SellerProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      throw ApiError.forbidden(
        "Complete your seller application before listing products",
      );
    }

    if (profile.status !== "active") {
      throw ApiError.forbidden("Your seller account is not yet active");
    }

    sellerId = profile._id;
  }

  // Admin-created product → store-owned product, no seller
  const slug = await uniqueSlug(req.body.nameEn);

  const product = await Product.create({
    ...req.body,
    seller: sellerId,
    slug,
  });

  sendSuccess(res, {
    statusCode: 201,
    data: product,
    message: "Product created",
  });
});

// PATCH /api/products/:id — req.resource populated by ownsResource middleware
const update = asyncHandler(async (req, res) => {
  const product = req.resource;
  if (req.body.nameEn && req.body.nameEn !== product.nameEn) {
    product.slug = await uniqueSlug(req.body.nameEn, product._id);
  }
  // Never let the client overwrite server-calculated fields.
  const { ratingAverage, reviewCount, seller, ...safeBody } = req.body;
  Object.assign(product, safeBody);
  await product.save();
  sendSuccess(res, { data: product, message: 'Product updated' });
});

// DELETE /api/products/:id
const remove = asyncHandler(async (req, res) => {
  const product = req.resource;
  product.isActive = false;
  await product.save();
  sendSuccess(res, { data: null, message: 'Product deactivated' });
});

// PATCH /api/products/:id/status (admin)
const setStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  product.isActive = !!req.body.isActive;
  await product.save();
  sendSuccess(res, { data: product, message: 'Product status updated' });
});

async function uniqueSlug(name, excludeId) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base, counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Product.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
}

/** Used by ownership middleware to load the resource being mutated. */
const loadProductForOwnership = (req) => Product.findById(req.params.id);

module.exports = {
  list, getById, getBySlug, getImages, addImage, deleteImage,
  create, update, remove, setStatus, loadProductForOwnership
};
