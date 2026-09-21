/** Human-friendly, sortable order number: SUP-20260915-7K3F9Q */
function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SUP-${date}-${random}`;
}

module.exports = generateOrderNumber;
