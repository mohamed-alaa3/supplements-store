# Supplements Store — Frontend

Angular 17 (standalone components) frontend for the supplements e-commerce
platform, built against the real backend in `../backend` — see
`backend/README.md` and `backend/postman/` for the API contract this
consumes.

> **Sandbox verification notice.** Like the backend, this frontend was built
> in an environment with no internet access, so `npm install` / `ng serve` /
> `ng build` have not actually been run here. Everything below marked
> "statically verified" was checked without a real Angular compiler (see
> §6); everything else needs a real `npm install && ng serve` on your
> machine as the first genuine test.

## 1. Setup

```bash
cd frontend
npm install
```

Set the backend URL in `src/environments/environment.ts` (defaults to
`http://localhost:5000/api`, matching the backend's default `PORT`):

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

## 2. Run

```bash
npm start        # ng serve, http://localhost:4200
npm run build    # production build
```

Run the backend first (`cd ../backend && npm run dev`, with `npm run seed`
for demo data) — the frontend has no mock/fallback data layer; every page
calls the real API.

## 3. Architecture

```
src/app/
  core/
    models/         18 TS interfaces mirroring the backend's Mongoose schemas exactly
    services/        17 API services (one per backend resource) + theme/language/toast/motion/cart-drawer
    interceptors/     auth (Bearer token, 401/403 handling), error (toast on failures)
    guards/           authGuard, roleGuard(...) — UX-only, backend re-checks everything
    i18n/             hand-rolled TranslateService + pipe, backed by assets/i18n/{en,ar}.json
    motion/           RevealDirective (GSAP scroll-reveal, IntersectionObserver-based)
  shared/components/  Navbar, Footer, CartDrawer, ProductCard, Rating, PriceTag, StockBadge,
                       QuantitySelector, LoadingSkeleton, EmptyState, SectionHeader, ToastHost
  pages/              one folder per route (see app.routes.ts) — 26 routes total, all lazy-loaded
```

**Design system**: `src/styles.scss` — an original palette (charcoal +
electric "volt" chartreuse + "ember" amber), light/dark themes as CSS custom
properties (re-composed per theme, not inverted), a fluid type scale, and
RTL-safe spacing via CSS logical properties throughout (verified: zero
hardcoded `left`/`right` anywhere in `pages/` or `shared/`).

## 4. What's fully built vs. lighter-touch

**Full treatment** (real GSAP entrances/reveals, Swiper galleries/carousels,
full loading/empty/error states, full backend integration): Home, Shop,
Product Details, Cart (+ drawer), Checkout, Order Confirmation, Login,
Register, Wishlist, Bundles, Bundle Builder, Orders (list + detail),
Account.

**Functional but utilitarian** (real backend integration, correct RBAC-gated
routes, but table/form-based UI rather than heavy animation — standard
practice for admin tooling): Seller Dashboard, Admin Dashboard + its four
sub-pages (Products, Orders, Categories, Customers).

**Presentational only**: the Contact form validates and shows a success
state but doesn't persist anywhere — the backend brief doesn't document a
contact-message endpoint, so nothing was invented to fake persistence (see
inline comment in `contact.component.ts`).

## 5. Known gap: Bundle Builder variant lookup

`Bundle.items` only stores variant `ObjectId`s, and the backend has no
public "get one variant by id" endpoint (only seller/admin-scoped
PATCH/DELETE). To show product names for a configurable bundle's options,
`bundle-builder.component.ts` loads a page of products + their variants and
matches by id client-side — documented in a code comment there. This works
for a reasonably sized catalog but doesn't scale well; a `GET
/api/variants/:id` endpoint (or denormalized display fields directly on
`BundleItemRule`) would be a better long-term fix on the backend.

The backend's own documented assumption (shipping-fee formula not specified
in the brief — see `backend/README.md` §6) flows through unchanged here:
the checkout page shows subtotal/discount live but explicitly tells the
user shipping and the final total are calculated server-side at order
placement, rather than the frontend guessing at a number.

## 6. How this was verified (and what wasn't)

**Actually run in this environment** (no Angular compiler available, so
these are structural/static checks, not a real build):
- Every one of the 26 lazy-loaded routes in `app.routes.ts` resolves to a
  real file with a matching `export class` name — checked programmatically.
- Every page using `ngModel`/`ngForm` imports `FormsModule`; every page
  using the `| t` pipe imports `TranslatePipe`; every page using
  `routerLink` imports `RouterLink`; every page using `appReveal` imports
  `RevealDirective` — all checked with zero misses.
- Every shared component tag used in a template (`<app-loading-skeleton>`,
  `<app-product-card>`, etc.) has a matching import in that page's
  component decorator.
- Every type imported from `core/models` (e.g. `ProductListItem`, `Order`,
  `Category`) is actually exported by the models barrel file — checked
  against all 63 exported names.
- `npx tsc --noEmit` across all 86 `.ts` files, filtered to pure syntax
  errors (TS1xxx) only, since full type-checking isn't possible without
  `@angular/core` installed (TS2xxx "cannot find module" errors are
  expected and were excluded) — **zero syntax errors**.
- Brace/paren/bracket balance checked across all 86 files — all balanced.
- Zero hardcoded `left`/`right` CSS in any page or shared component
  (RTL correctness relies entirely on logical properties).

**Not verified — needs `npm install && ng serve` on your machine:**
- That the app actually compiles with the real Angular compiler (template
  syntax like `@if`/`@for`/`@switch` control flow can only be validated by
  the real Angular template compiler, which needs `@angular/core`
  installed).
- Real HTTP calls against the real backend end-to-end.
- Swiper/GSAP/CDK actually rendering and animating in a browser.
- Visual QA across breakpoints, both themes, and both languages.

## 7. i18n / theme quick reference

- Language: `LanguageService` (`core/services/language.service.ts`) —
  toggled from the navbar, persisted to `localStorage`, drives
  `html[lang]`/`html[dir]`. `lang.pick(ar, en)` picks the right side of any
  bilingual model field.
- Theme: `ThemeService` — toggled from the navbar, persisted, defaults to
  `prefers-color-scheme`, drives `html[data-theme]`.
- Static UI strings: `assets/i18n/en.json` / `ar.json`, via the `| t` pipe.
