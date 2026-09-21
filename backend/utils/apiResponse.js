/**
 * Standard response envelope shared by every controller — matches backend
 * brief §7 REST & Response Standards exactly:
 *   { success, data, message?, meta? } / { success:false, message, errors? }
 */
function sendSuccess(res, { statusCode = 200, data = null, message, meta } = {}) {
  const body = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

function buildMeta({ page, limit, totalItems }) {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / limit))
  };
}

module.exports = { sendSuccess, buildMeta };
