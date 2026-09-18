# Demo seed — SEED.md

Generates a complete, realistic demo catalog for the Supplements e-commerce
backend: users, brands, categories, products with variants/images/inventory,
banners, bundles, coupons, reviews, addresses, orders, carts and wishlists —
all built strictly against the models, controllers, validators and services
that already exist in this repo (no schema changes, no new endpoints).

## 1. What was inspected before writing any data

Every model in `models/` was read in full, plus the code paths that actually
consume the data, so the demo data matches real behavior and not just the
schema shape:

- **Pricing**: `controllers/product.controller.js`'s list endpoint computes
  `priceFrom` as the **minimum active variant price** (not `Product.basePrice`).
  `services/checkout.service.js` / `services/pricing.service.js` compute the
  price actually charged as `applyDiscount(variant.price, product.discountType,
  product.discountValue)`. So `Product.basePrice`/`compareAtPrice` and
  `ProductVariant.compareAtPrice` are **display-only** fields (confirmed by
  grepping every usage) — the seed sets them consistently with the variant
  prices rather than treating them as another independent source of truth.
- **Inventory status**: `models/Inventory.js` has a `pre('save')` hook that
  recomputes `status` from `stockQuantity`/`reservedQuantity`/`lowStockThreshold`.
  The generator mirrors that exact formula so seeded stock states
  (in stock / low stock / out of stock) are correct even though bulk
  `insertMany` doesn't run `save` hooks.
- **Bundles**: `controllers/bundle.controller.js`'s quote logic uses
  `bundle.bundlePrice` when set, otherwise `applyDiscount(subtotal,
  discountType, discountValue)`. For the one `configurable` bundle, a flat
  `bundlePrice` would stay fixed regardless of what the customer picks, so
  that bundle intentionally uses `discountType`/`discountValue` instead so
  the quote scales with the selection — `bundlePrice` is only used on the
  four `fixed` bundles.
- **Reviews**: `controllers/review.controller.js` only folds **approved**
  reviews into `Product.ratingAverage`/`reviewCount`. The seed reproduces
  that recomputation itself so a freshly-seeded product's rating already
  matches its approved reviews (a few reviews are seeded as `pending` on
  purpose, to leave something in the moderation queue for the admin demo).
- **Orders**: `utils/orderNumber.js`'s format, `services/checkout.service.js`'s
  shipping-fee rule (flat 50 EGP, free at ≥1500 EGP subtotal, from the
  `.env` defaults), and `utils/paymentMethods.js` (only `cash_on_delivery`
  is supported) are all reproduced exactly so seeded orders are
  indistinguishable from ones placed through the real checkout flow.
- **Slugs**: `slugify(name, { lower: true, strict: true })` — the same call
  used in `controllers/brand.controller.js`, `category.controller.js`,
  `product.controller.js`, `seller.controller.js`, `bundle.controller.js`.
- **Passwords**: hashed with `bcryptjs` at 10 salt rounds into `passwordHash`,
  matching `SALT_ROUNDS` in `controllers/auth.controller.js` exactly (no
  plaintext password is ever stored).

## 2. What gets created

| Collection | Count | Notes |
|---|---:|---|
| Users | 18 | 1 admin, 3 sellers, 14 customers |
| SellerProfiles | 3 | one per seller, realistic store names/descriptions |
| Brands | 12 | across whey/protein, creatine, pre-workout, vitamins, hydration, snacks, accessories |
| Categories | 10 | Whey Protein, Weight Gainer, Creatine, Energy & Performance, Amino Acids, Hydration & Energy, Vitamins, Minerals, Healthy Snacks, Accessories |
| Products | 50 | varied catalog across all 10 categories, realistic AR/EN names & copy |
| ProductVariants | 81 | flavor/size combinations where the product supports them |
| ProductImages | 80 | 1 primary image per product, a 2nd "nutrition facts" image on featured/best-seller items |
| Inventory | 81 | one per variant; ~61% in stock, ~24% low stock, ~15% out of stock |
| Banners | 5 | 1 hero, promo, free-shipping, performance-focused, protein-focused |
| Bundles | 5 | 4 fixed-price, 1 configurable (Daily Wellness) |
| Coupons | 5 | `WELCOME10`, `FIT15`, `NEWUSER20`, `BUNDLE10`, `FREESHIP` |
| Reviews | ~140 | on ~65% of products, realistic 1–5 star distribution, AR+EN text |
| Addresses | 16 | 1–2 per customer, real Egyptian cities/areas |
| Orders | 17 | covers every `orderStatus` enum value at least once |
| Carts | 6 | in-progress carts for a subset of customers |
| Wishlists | 5 | for a subset of customers |

### Image strategy

`ProductImage.url` / `Banner.imageUrl` are plain strings in the schema — the
app doesn't require locally-hosted files (it also serves `/uploads`
statically for anything you upload later). Because this sandbox has no
network access to image hosts, product/banner images are generated via
`https://placehold.co/...&text=<product name>` — stable, always-resolving
placeholder graphics labeled with the real product name, not stock photography.
They will render correctly in the Angular frontend as soon as it has normal
internet access. **If you want real product photography**, swap the `url:`
line in `utils/seedDemo/generators/products.js` (and `banners.js`) for your
own asset URLs or local `/uploads/...` paths — everything else keeps working
unchanged.

## 3. How to run it

```bash
cd backend
npm install                 # if you haven't already
npm run verify:seed         # offline check — no MongoDB needed, ~1 second
npm run seed:demo           # connects to MONGO_URI from .env and writes the data
```

`verify:seed` builds the exact same dataset in memory and validates every
document against the real Mongoose models (`validateSync`) plus checks every
foreign-key-style reference and uniqueness constraint — all without touching
a database. Run it any time you edit a generator, before touching real data.

`seed:demo` re-runs the same validation, then connects with `config/db.js`
and writes everything. **It's safe to re-run**: it first deletes only the
demo documents it created itself (matched by the fixed `@supplements.test` /
`@customer-demo.test` email domains and everything that hangs off those
users/sellers — see `utils/seedDemo/write.js#clearDemoData`), so it never
touches unrelated real accounts or data.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@supplements.test` | `Admin123!` |
| Seller | `seller.ironcore@supplements.test` | `Seller123!` |
| Seller | `seller.peakform@supplements.test` | `Seller123!` |
| Seller | `seller.purevital@supplements.test` | `Seller123!` |
| Customer (sample) | `omar.khaled@customer-demo.test` | `Customer123!` |

(All 14 customers share the password `Customer123!`; the sample above is
just one to log in and click around with. Full list is printed to the
console at the end of `npm run seed:demo`.)

## 4. Verification report

This sandbox has **no network access to MongoDB** (Atlas isn't in the
allowed egress list) **and no local `mongod` binary available** (not in the
Ubuntu 24 apt repos, and no network path to download one) — the same
sandbox limitation already noted in this repo's own `config/db.js`. So the
data was never inserted into a live database from here, and the frontend
integration steps in the original request (section 15/16) couldn't be
exercised at all, because **only `backend.zip` was uploaded — no Angular
frontend code was provided to inspect or run against.**

Given that, here's exactly what was and wasn't checked:

**VERIFIED**
- Every model file, relevant controller, service, validator and util in the
  backend was read in full (list above) — the seed data structure is built
  directly from that code, not assumed.
- Every generated document passes `new Model(doc).validateSync()` against
  the **real, unmodified** Mongoose models in `models/` (required fields,
  types, enums, min/max) — see `npm run verify:seed` output.
- Every reference between generated documents resolves (product → brand /
  category / seller, variant → product, inventory → variant, order items →
  product/variant/seller, bundle items → variant, coupon → category, cart/
  wishlist → variant/product, review → user/product, address/order/cart/
  wishlist → user).
- Every field with a `unique` index in the schema (user email, seller slug,
  brand slug/name, category slug, product slug, variant SKU, inventory→variant,
  bundle slug, coupon code, cart/wishlist→user, review user+product pair) has
  no duplicates across the generated set.
- Order pricing (`unitPrice`, `lineTotal`, `subtotal`, `discountTotal`,
  `shippingFee`, `total`) is computed with the exact same formulas as
  `services/pricing.service.js` / `services/checkout.service.js`, and a
  final total-consistency check (`subtotal − discount + shipping == total`)
  passes for all 17 orders.
- `npm install` succeeds and all `.js` files in `utils/seedDemo/` and
  `scripts/` pass a Node syntax check.

**PARTIALLY VERIFIED**
- The `Inventory.status` values are computed with the identical formula the
  real `pre('save')` hook uses, so they'll be correct once written — but
  this wasn't observed running through that actual hook against a live
  document (bulk `insertMany` skips `save` middleware; the value we supply
  is already the hook's output, not a fallback).
- `Coupon.usedCount` is reconciled against how many of the 17 seeded orders
  reference that coupon's code, but no real `POST /api/orders` / coupon-
  redemption request was made — it's a static count, not an
  incremented-through-the-API one.

**NOT VERIFIED**
- The seed script has not been run against a real MongoDB instance from
  this environment. `npm run seed:demo` will do so from your machine —
  please run it and check the console output ends with "Seed completed
  successfully."
- No live API endpoints were called (`GET /api/banners`, `/api/products`,
  `/api/bundles`, etc.) — do this after seeding, from your machine:
  ```bash
  npm run dev
  curl http://localhost:5000/api/banners
  curl http://localhost:5000/api/categories
  curl http://localhost:5000/api/products
  curl "http://localhost:5000/api/products?featured=true"
  curl "http://localhost:5000/api/products?bestSeller=true"
  curl http://localhost:5000/api/bundles
  ```
- The Angular frontend was not part of the upload for this task, so none of
  its pages (Home, Shop, Product Details, Cart, Checkout, Wishlist, Bundles,
  Bundle Builder, Orders, Account, Seller/Admin Dashboard) could be opened
  or checked against the seeded data. Everything above confirms the API
  will *serve* well-formed, cross-referenced data; confirming the Angular
  app renders it correctly still needs a manual pass on your side.
- Product images are stable placeholder graphics (see "Image strategy"
  above), not licensed product photography — swap them for real assets
  when you're ready for the actual graduation-project presentation.

## 5. Files added

```
backend/
  utils/
    seedDemo.js                    # npm run seed:demo — connects, validates, writes
    seedDemo/
      rng.js                       # seeded PRNG so prices/stock/dates are reproducible
      lookup.js                    # find-product/variant helpers used by bundles/orders
      build.js                     # composes every generator into one dataset (pure, offline)
      verify.js                    # schema + reference + uniqueness validation (pure, offline)
      write.js                     # writes a built dataset into MongoDB, dependency-ordered
      generators/
        users.js                   # admin, sellers + SellerProfiles, customers
        catalog.js                 # brands, categories
        products.js                # products + variants + images (data-driven blueprints)
        inventory.js                # one Inventory doc per variant
        banners.js
        bundles.js
        coupons.js
        reviews.js
        addresses.js
        orders.js
        carts.js
        wishlists.js
  scripts/
    verifySeedData.js              # npm run verify:seed — offline validator CLI
  SEED.md                          # this file
```

Nothing in `models/`, `controllers/`, `routes/`, `validators/`, `services/`,
`middlewares/`, `config/`, `app.js` or `server.js` was changed, and
`utils/seed.js` (the original minimal seed script) was left untouched —
`seed:demo` is a separate, additive script.
