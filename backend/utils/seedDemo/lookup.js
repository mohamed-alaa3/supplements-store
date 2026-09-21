/**
 * Small query helpers over the flat products/variants arrays produced by
 * products.js. Kept separate from products.js so any generator that runs
 * *after* products (bundles, orders, reviews, carts, wishlists) can look
 * things up by name instead of hard-coding ObjectIds.
 */
function buildLookup(products, variants) {
  function findProduct(nameEn, brandId) {
    const matches = products.filter((p) => p.nameEn === nameEn && (!brandId || String(p.brand) === String(brandId)));
    if (!matches.length) throw new Error(`Lookup failed: no product named "${nameEn}"`);
    return matches[0];
  }

  function variantsOf(productId) {
    return variants.filter((v) => String(v.product) === String(productId));
  }

  function defaultVariant(productId) {
    const list = variantsOf(productId);
    return list.find((v) => v.isDefault) || list[0];
  }

  function variantByLabel(productId, { flavor, sizeLabel } = {}) {
    const list = variantsOf(productId);
    const match = list.find(
      (v) => (!flavor || v.flavor === flavor) && (!sizeLabel || v.sizeLabel === sizeLabel)
    );
    return match || list[0];
  }

  return { findProduct, variantsOf, defaultVariant, variantByLabel };
}

module.exports = { buildLookup };
