# Supplements Store API

Node.js + Express + MongoDB/Mongoose backend for the supplements e-commerce
platform, built against `Supplements-Store-Backend-Graduation-Brief.docx` as
the single source of truth for models, endpoints, roles, and business rules.

> **Sandbox verification notice** — read this first.
> This backend was written and statically verified in an environment with
> **no internet access and no local MongoDB**. Every route/controller/model
> was confirmed to wire together correctly (see "How this was verified"
> below), and all business logic was code-reviewed against the brief, but
> **no request has actually round-tripped through a live MongoDB in this
> environment**. Follow the steps below to run it for real; that's the
> first genuine end-to-end run.

## 1. Requirements

- Node.js 18+
- A MongoDB instance — either:
  - local: `mongodb://127.0.0.1:27017/supplements_store`, or
  - [MongoDB Atlas](https://www.mongodb.com/atlas) free tier connection string

## 2. Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env — at minimum set MONGO_URI and JWT_SECRET
```

### Environment variables (`.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | no (default 5000) | HTTP port |
| `NODE_ENV` | no | `development` / `production` |
| `MONGO_URI` | **yes** | MongoDB connection string |
| `JWT_SECRET` | **yes** | Long random string used to sign JWTs |
| `JWT_EXPIRES_IN` | no (default `7d`) | Token lifetime |
| `CLIENT_URL` | no (default `http://localhost:4200`) | Allowed CORS origin (the Angular app) |
| `UPLOAD_DIR` | no (default `uploads`) | Local folder for uploaded images |
| `MAX_UPLOAD_SIZE_MB` | no (default 5) | Upload size cap |
| `FLAT_SHIPPING_FEE` | no (default 50) | See "Known gap: shipping fee" below |
| `FREE_SHIPPING_THRESHOLD` | no (default 1500) | Subtotal above which shipping is free |

`server.js` fails fast with a clear message if `MONGO_URI` or `JWT_SECRET`
is missing — it will not silently start against a broken config.

## 3. Run

```bash
npm run dev     # nodemon, auto-restart
# or
npm start       # plain node
```

Expected console output on a successful boot:

```
[mongo] connected
[server] listening on port 5000 (development)
```

If MongoDB is unreachable, the process logs the connection error and exits
with a non-zero code rather than serving requests against a dead DB.

### Seed some demo data (optional but recommended)

```bash
npm run seed
```

Creates (idempotently — safe to re-run):
- an admin user — `admin@supplements.test` / `Admin123!`
- an active seller — `seller@supplements.test` / `Seller123!` — with a store profile
- one category (Protein), one brand (IronCore)
- one product with one variant, inventory row (40 in stock), and a placeholder image

### Health check

```bash
curl http://localhost:5000/api/health
```

## 4. API overview

Base path: `/api`. Every response follows:

```json
{ "success": true, "data": ..., "message"?: "...", "meta"?: { "page":1,"limit":20,"totalItems":0,"totalPages":1 } }
{ "success": false, "message": "...", "errors"?: [{ "field": "email", "message": "..." }] }
```

| Group | Base path | Notes |
|---|---|---|
| Health | `/health` | Liveness + DB connection state |
| Auth | `/auth` | register, login, me, update profile, change/forgot/reset password |
| Users | `/users` | own profile + address book |
| Sellers (public) | `/sellers` | directory, apply, own profile |
| Seller (scoped) | `/seller` | orders, summary, inventory — the authenticated seller only |
| Brands | `/brands` | public read, admin write |
| Categories | `/categories` | public read (nested tree), admin write |
| Products | `/products` | search/filter/sort/paginate, variants, images, reviews nested |
| Variants | `/variants` | update/delete by id (ownership-checked) |
| Inventory | `/inventory` | per-variant stock (seller/admin only) |
| Cart | `/cart` | server-priced, server-owned |
| Wishlist | `/wishlist` | |
| Bundles | `/bundles` | validate/quote/add-to-cart, server-priced |
| Coupons | `/coupons/validate` | validates against the caller's live cart |
| Orders | `/orders` | **checkout lives here — see §5** |
| Reviews | `/reviews` | update/delete by id; moderation under `/admin/reviews` |
| Banners | `/banners` | public read, admin write |
| Uploads | `/uploads/image` | multipart image upload (seller/admin) |
| Admin | `/admin/*` | users, sellers, inventory, coupons, orders, reviews, overview — all admin-only |

Full endpoint-by-endpoint detail is in the Postman collection
(`postman/Supplements-Store-API.postman_collection.json`) and mirrors the
Angular services in `frontend/src/app/core/services/*.service.ts` 1:1 —
every URL a service calls exists here at the same path.

## 5. Authentication & RBAC

- **Register** → `bcryptjs.hash` → `User.create` (role always starts as `customer`)
- **Login** → `bcryptjs.compare` → `jsonwebtoken.sign({ sub, role })`
- Every protected route requires `Authorization: Bearer <token>`, checked
  by `middlewares/protect.js`, which loads the live user (so a deactivated
  account is rejected even with a valid, unexpired token).
- `middlewares/authorize.js` gates by role (`customer` / `seller` / `admin`).
- `middlewares/ownership.js` (`ownsResource`) and the inline ownership
  checks in `variant.controller.js` / `bundle.controller.js` confirm a
  **seller** only edits their own products/variants/bundles; **admin**
  always passes.
- The frontend's route guards are UX only — every one of these checks is
  re-enforced server-side, per the brief.

## 6. Checkout — server-authoritative order integrity

All order creation goes through `services/checkout.service.js`
(`createOrderFromCart`), inside a MongoDB **transaction**
(`mongoose.startSession()` + `session.withTransaction`):

1. Re-reads the user's Cart fresh from the DB.
2. For every line, re-reads the `ProductVariant` + parent `Product` fresh
   and recomputes the unit price from `basePrice`/`discountType`/
   `discountValue` — **the client never sends a price**.
3. Re-checks stock (`stockQuantity - reservedQuantity >= quantity`) for
   every line; aborts with `409` on any shortfall.
4. Re-evaluates the cart's coupon (window, usage caps, min order value,
   product/category scope) — an expired/invalid coupon is dropped rather
   than trusted.
5. Computes `subtotal`, `discountTotal`, `shippingFee`, `total` — all
   server-side.
6. Writes the `Order` (with a full item/price/address snapshot),
   decrements inventory, increments the coupon's `usedCount`, and clears
   the cart — all inside the same transaction, so a failure at any step
   rolls back everything.

Cancelling a `pending`/`confirmed` order (`orders/:id/cancel`, or an
admin/seller status change into `cancelled`/`returned`) restocks inventory
via the same transactional path (`restockOrder`).

### Known gap: shipping-fee policy

The backend brief does not specify an exact shipping-fee algorithm (flat
vs. per-seller vs. zone/weight-based). `checkout.service.js` currently uses
a flat fee with a free-shipping threshold (both env-configurable) and
isolates this in one function (`computeShippingFee`) specifically so the
real policy is a one-line change once confirmed. This is the one place in
the backend where a business rule was assumed rather than read directly
from the brief — everything else (pricing, stock, coupons, RBAC) is
implemented exactly as documented.

## 7. How this was verified (and what wasn't)

This backend went through two passes: an initial build-time check, and a
dedicated final audit against the brief that found and fixed several real
issues (see "Issues found and fixed in the final audit" below).

**Actually run in this environment:**
- `node --check` against every backend `.js` file — zero syntax errors,
  re-run after every fix.
- A from-scratch, isolated stub of `express`/`mongoose`/`bcryptjs`/
  `jsonwebtoken`/etc. (kept entirely outside this folder, never shipped)
  that lets Node actually `require('./app')` and `require('./server')`.
  This is not a mock backend — it doesn't fake business logic — it only
  replaces the two heaviest third-party libraries enough to prove every
  `require`, every controller reference, and every route registration
  resolves to a real function. This run:
  - Loaded `app.js` and enumerated **97 registered API routes**, confirming
    every controller/middleware a route references actually exists and is
    exported correctly — an undefined handler throws immediately, the same
    way real Express does. (This caught two real wiring bugs while the
    routes were first being built; both were fixed before the initial
    report.)
  - Loaded all **16 Mongoose models** with no duplicate-registration or
    schema-definition errors, and printed each model's inline-`unique`
    fields against its explicit `schema.index()` calls to confirm no
    duplicate index declarations remain (the final audit found and removed
    11 redundant ones).
  - Ran the real `server.js` boot sequence end-to-end against the stub.
  - Spot-checked pure business logic directly, e.g.
    `pricing.service.applyDiscount(1200, 'percentage', 10) === 1080`,
    `ApiError.badRequest(...).statusCode === 400`.
- A programmatic diff between the live route table and the Postman
  collection confirmed **all 97 routes have a matching request** (see §10).
- `npm install` and a search for `mongod`/`mongosh` — **both genuinely
  fail** in this sandbox (no network egress, no local MongoDB binary).

**Not verified — needs a real run on your machine:**
- Actual HTTP request/response cycles end-to-end.
- Actual MongoDB reads/writes, indexes, and the checkout transaction
  committing/rolling back for real.
- `express-validator`'s real validation behavior (the stub always "passes").
- `multer`'s real file-upload handling.
- Password hashing/JWT round-trips with real `bcryptjs`/`jsonwebtoken`.

### Issues found and fixed in the final audit

1. **Insufficient stock returned 409, brief requires 400** (§22, §30) — fixed in `stock.service.js`.
2. **11 redundant `schema.index()` calls** duplicating an inline `unique: true` on the same field (would log Mongoose duplicate-index warnings) — removed across 11 models.
3. **Missing compound indexes** `Product: seller+isActive` and `Product: productType+isActive` from brief §38 — added.
4. **`paymentMethod` was accepted as any non-empty string** — brief §24 requires the backend to validate it's a supported method; added a `SUPPORTED_PAYMENT_METHODS` allowlist enforced at both the validator layer and inside `checkout.service.js` itself (defense in depth for a money-related field).
5. **Shipping-fee constants read `process.env` directly** inside `checkout.service.js`, bypassing the single `config/env.js` module — moved into `config/env.js`; `.env.example` was also missing these two variables — added.
6. **Logger was dev-only** — brief §6 lists `logger` as a required (not optional) middleware — `morgan` now always runs (`dev` format locally, `combined` in production).
7. **Bundle selection quantities weren't checked for being positive integers** (brief §10) — added.
8. **Coupon `maxDiscount` cap only applied to percentage-type coupons** — brief §13 doesn't scope it to one type — now applied uniformly.
9. **PATCH (update) routes had no field-level request validation**, relying only on Mongoose schema validation as a fallback — added `validate` + rule sets for Product, Variant, Brand, Category, Banner updates, and enum validators for every single-field "change status" endpoint (order/seller/user/review status, user role, product `isActive`).

None of these were show-stoppers — the app was already close — but each was a genuine deviation from the brief, now corrected and re-verified with the wiring harness above.

## 8. Testing it for real

1. `npm install && npm run dev` with a real `MONGO_URI`.
2. `npm run seed` for demo data.
3. Import `postman/Supplements-Store-API.postman_collection.json` into
   Postman — it's generated directly from the live route table, so all 97
   endpoints have a request, organized into folders (Auth, Users, Sellers,
   Brands, Categories, Products, Variants, Inventory, Cart, Wishlist,
   Bundles, Coupons, Orders, Reviews, Banners, Uploads, Admin, Health) plus
   a **"Negative & Edge Cases"** folder covering the specific scenarios the
   brief calls out: 401 without a token, 403 for the wrong role, seller
   ownership denial, insufficient stock, invalid coupon, successful
   checkout, cart clearing after checkout, and duplicate review.
4. Run **Auth → Login (seed admin/seed seller)** and **Auth →
   Register/Login (customer)** first — their test scripts save tokens into
   collection variables automatically; every other request reuses them.
5. Suggested happy-path walk-through: register → login → browse products →
   add to cart → apply coupon → checkout → view order → cancel order →
   seller login → create product/variant → admin login → approve a review →
   adjust inventory. Then run the Negative & Edge Cases folder.

## 9. Project structure

```
backend/
  app.js, server.js        Express app assembly / entry point
  config/                  env.js, db.js
  models/                  16 Mongoose schemas
  controllers/              one per resource
  routes/                  one per resource + admin.routes.js aggregator + index.js
  services/                pricing, stock, coupon, checkout (order integrity)
  middlewares/             protect, authorize, ownership, validate, errorHandler, notFound, rateLimit, upload
  validators/               express-validator rule sets per resource
  utils/                    asyncHandler, ApiError, apiResponse, generateToken, pagination, orderNumber, seed.js
  postman/                  Postman collection
  uploads/                  local image upload target (gitignored)
```
