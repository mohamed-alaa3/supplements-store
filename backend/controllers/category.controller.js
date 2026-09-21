const slugify = require('slugify');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Category = require('../models/Category');

// GET /api/categories — returns a nested tree (top-level with .children populated one level)
const list = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, nameEn: 1 });
  const byParent = new Map();
  for (const cat of categories) {
    const key = cat.parent ? String(cat.parent) : 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(cat);
  }
  const attachChildren = (cat) => ({
    ...cat.toObject(),
    children: (byParent.get(String(cat._id)) || []).map(attachChildren)
  });
  const roots = (byParent.get('root') || []).map(attachChildren);
  sendSuccess(res, { data: roots });
});

const getBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) throw ApiError.notFound('Category not found');
  sendSuccess(res, { data: category });
});

const create = asyncHandler(async (req, res) => {
  const slug = await uniqueSlug(req.body.nameEn);
  const category = await Category.create({ ...req.body, slug });
  sendSuccess(res, { statusCode: 201, data: category, message: 'Category created' });
});

const update = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  if (req.body.nameEn && req.body.nameEn !== category.nameEn) {
    category.slug = await uniqueSlug(req.body.nameEn, category._id);
  }
  Object.assign(category, req.body);
  await category.save();
  sendSuccess(res, { data: category, message: 'Category updated' });
});

const remove = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  category.isActive = false;
  await category.save();
  sendSuccess(res, { data: null, message: 'Category deactivated' });
});

async function uniqueSlug(name, excludeId) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base, counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Category.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
}

module.exports = { list, getBySlug, create, update, remove };
