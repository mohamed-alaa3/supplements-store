const slugify = require('slugify');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Brand = require('../models/Brand');

const list = asyncHandler(async (req, res) => {
  const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
  sendSuccess(res, { data: brands });
});

const getBySlug = asyncHandler(async (req, res) => {
  const brand = await Brand.findOne({ slug: req.params.slug });
  if (!brand) throw ApiError.notFound('Brand not found');
  sendSuccess(res, { data: brand });
});

const create = asyncHandler(async (req, res) => {
  const slug = await uniqueSlug(req.body.name);
  const brand = await Brand.create({ ...req.body, slug });
  sendSuccess(res, { statusCode: 201, data: brand, message: 'Brand created' });
});

const update = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw ApiError.notFound('Brand not found');

  if (req.body.name && req.body.name !== brand.name) {
    brand.slug = await uniqueSlug(req.body.name, brand._id);
  }
  Object.assign(brand, req.body);
  await brand.save();
  sendSuccess(res, { data: brand, message: 'Brand updated' });
});

const remove = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw ApiError.notFound('Brand not found');
  brand.isActive = false;
  await brand.save();
  sendSuccess(res, { data: null, message: 'Brand deactivated' });
});

async function uniqueSlug(name, excludeId) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base, counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Brand.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
}

module.exports = { list, getBySlug, create, update, remove };
