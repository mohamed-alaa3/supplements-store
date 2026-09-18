import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { roleGuard } from "./core/guards/role.guard";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./pages/home/home.component").then((m) => m.HomeComponent),
    title: "Supplements Store",
  },
  {
    path: "shop",
    loadComponent: () =>
      import("./pages/shop/shop.component").then((m) => m.ShopComponent),
    title: "Shop",
  },
  {
    path: "category/:slug",
    loadComponent: () =>
      import("./pages/shop/shop.component").then((m) => m.ShopComponent),
    title: "Category",
  },
  {
    path: "search",
    loadComponent: () =>
      import("./pages/shop/shop.component").then((m) => m.ShopComponent),
    title: "Search",
  },
  {
    path: "products/:id",
    loadComponent: () =>
      import("./pages/product-details/product-details.component").then(
        (m) => m.ProductDetailsComponent,
      ),
    title: "Product",
  },
  {
    path: "bundles",
    loadComponent: () =>
      import("./pages/bundles/bundles.component").then(
        (m) => m.BundlesComponent,
      ),
    title: "Bundles",
  },
  {
    path: "bundle-builder",
    loadComponent: () =>
      import("./pages/bundle-builder/bundle-builder.component").then(
        (m) => m.BundleBuilderComponent,
      ),
    title: "Build Your Own Bundle",
  },

  {
    path: "cart",
    loadComponent: () =>
      import("./pages/cart/cart.component").then((m) => m.CartComponent),
    title: "Cart",
  },
  {
    path: "checkout",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/checkout/checkout.component").then(
        (m) => m.CheckoutComponent,
      ),
    title: "Checkout",
  },
  {
    path: "order-confirmation/:id",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/order-confirmation/order-confirmation.component").then(
        (m) => m.OrderConfirmationComponent,
      ),
    title: "Order confirmed",
  },
  {
    path: "wishlist",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/wishlist/wishlist.component").then(
        (m) => m.WishlistComponent,
      ),
    title: "Wishlist",
  },

  {
    path: "login",
    loadComponent: () =>
      import("./pages/auth/login/login.component").then(
        (m) => m.LoginComponent,
      ),
    title: "Log in",
  },
  {
    path: "register",
    loadComponent: () =>
      import("./pages/auth/register/register.component").then(
        (m) => m.RegisterComponent,
      ),
    title: "Create account",
  },

  {
    path: "account",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/account/account.component").then(
        (m) => m.AccountComponent,
      ),
    title: "My account",
  },
  {
    path: "orders",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/orders/orders.component").then((m) => m.OrdersComponent),
    title: "My orders",
  },
  {
    path: "orders/:id",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/orders/order-details/order-details.component").then(
        (m) => m.OrderDetailsComponent,
      ),
    title: "Order details",
  },

  {
    path: "about",
    loadComponent: () =>
      import("./pages/static/about/about.component").then(
        (m) => m.AboutComponent,
      ),
    title: "About us",
  },
  {
    path: "contact",
    loadComponent: () =>
      import("./pages/static/contact/contact.component").then(
        (m) => m.ContactComponent,
      ),
    title: "Contact us",
  },
  {
    path: "faq",
    loadComponent: () =>
      import("./pages/static/faq/faq.component").then((m) => m.FaqComponent),
    title: "FAQ",
  },

  {
    path: "seller",
    canActivate: [roleGuard(["seller"])],
    loadComponent: () =>
      import("./pages/seller/seller-dashboard/seller-dashboard.component").then(
        (m) => m.SellerDashboardComponent,
      ),
    title: "Seller dashboard",
  },

  {
    path: "admin",
    canActivate: [roleGuard(["admin"])],
    loadComponent: () =>
      import("./pages/admin/admin-dashboard/admin-dashboard.component").then(
        (m) => m.AdminDashboardComponent,
      ),
    title: "Admin dashboard",
  },
  {
    path: "admin/products",
    canActivate: [roleGuard(["admin"])],
    loadComponent: () =>
      import("./pages/admin/admin-products/admin-products.component").then(
        (m) => m.AdminProductsComponent,
      ),
    title: "Admin · Products",
  },
  {
    path: "admin/orders",
    canActivate: [roleGuard(["admin"])],
    loadComponent: () =>
      import("./pages/admin/admin-orders/admin-orders.component").then(
        (m) => m.AdminOrdersComponent,
      ),
    title: "Admin · Orders",
  },
  {
    path: "admin/products/new",
    canActivate: [roleGuard(["admin"])],
    loadComponent: () =>
      import("./pages/admin/admin-product-form/admin-product-form.component").then(
        (m) => m.AdminProductFormComponent,
      ),
    title: "Admin · Add Product",
  },
  {
    path: "admin/products/:id/edit",
    canActivate: [roleGuard(["admin"])],
    loadComponent: () =>
      import("./pages/admin/admin-product-form/admin-product-form.component").then(
        (m) => m.AdminProductFormComponent,
      ),
    title: "Admin · Edit Product",
  },
  {
    path: "admin/categories",
    canActivate: [roleGuard(["admin"])],
    loadComponent: () =>
      import("./pages/admin/admin-categories/admin-categories.component").then(
        (m) => m.AdminCategoriesComponent,
      ),
    title: "Admin · Categories",
  },
  {
    path: "admin/customers",
    canActivate: [roleGuard(["admin"])],
    loadComponent: () =>
      import("./pages/admin/admin-customers/admin-customers.component").then(
        (m) => m.AdminCustomersComponent,
      ),
    title: "Admin · Customers",
  },

  {
    path: "not-found",
    loadComponent: () =>
      import("./pages/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
    title: "Not found",
  },
  { path: "**", redirectTo: "not-found" },
];
