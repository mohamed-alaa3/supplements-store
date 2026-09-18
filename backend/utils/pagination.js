const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Normalizes ?page=&limit= query params with sane defaults and an upper bound. */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

module.exports = { parsePagination, DEFAULT_LIMIT, MAX_LIMIT };
