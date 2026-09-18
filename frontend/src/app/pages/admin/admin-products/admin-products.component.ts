import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

import {
  ProductListItem,
  ProductQueryParams,
  ProductType,
} from "../../../core/models";

import { ProductService } from "../../../core/services/product.service";
import { LanguageService } from "../../../core/services/language.service";
import { ToastService } from "../../../core/services/toast.service";

import { LoadingSkeletonComponent } from "../../../shared/components/loading-skeleton/loading-skeleton.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { MediaUrlPipe } from "../../../core/pipes/media-url.pipe";
import { Router } from "@angular/router";
@Component({
  selector: "app-admin-products",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    MediaUrlPipe,
  ],
  templateUrl: "./admin-products.component.html",
  styleUrl: "./admin-products.component.scss",
})
export class AdminProductsComponent implements OnInit {
  products = signal<ProductListItem[]>([]);
  loading = signal(true);
  error = signal(false);

  search = "";
  status = "all";
  productType = "";
  stock = "";
  sort: ProductQueryParams["sort"] = "newest";

  readonly productTypes: ProductType[] = [
    "supplement",
    "protein",
    "vitamin",
    "mineral",
    "preworkout",
    "amino",
    "hydration",
    "snack",
    "equipment",
    "bundle",
  ];

  constructor(
    private productService: ProductService,
    public lang: LanguageService,
    private toast: ToastService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    const query: ProductQueryParams = {
      search: this.search.trim() || undefined,
      productType: (this.productType as ProductType) || undefined,
      sort: this.sort,
      page: 1,
      limit: 100,
    };

    if (this.status === "active") {
      query.inStock = undefined;
    }

    if (this.stock === "in_stock") {
      query.inStock = true;
    }

    this.productService
      .list(query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          let items = res.data ?? [];

          // Status is not a documented backend filter,
          // so we filter it locally.
          if (this.status === "active") {
            items = items.filter((p) => p.isActive);
          }

          if (this.status === "inactive") {
            items = items.filter((p) => !p.isActive);
          }

          // Backend returns stockState, so these are safe
          // defensive client-side filters.
          if (this.stock === "low_stock") {
            items = items.filter((p) => p.stockState === "low_stock");
          }

          if (this.stock === "out_of_stock") {
            items = items.filter((p) => p.stockState === "out_of_stock");
          }

          this.products.set(items);
        },

        error: () => {
          this.error.set(true);

          this.toast.error(
            this.lang.pick("تعذر تحميل المنتجات", "Failed to load products"),
          );
        },
      });
  }

  onSearch(): void {
    this.load();
  }

  clearFilters(): void {
    this.search = "";
    this.status = "all";
    this.productType = "";
    this.stock = "";
    this.sort = "newest";

    this.load();
  }

  toggleStatus(product: ProductListItem): void {
    const nextStatus = !product.isActive;

    this.productService.setStatus(product._id, nextStatus).subscribe({
      next: (res) => {
        this.products.update((list) =>
          list.map((item) =>
            item._id === product._id
              ? {
                  ...item,
                  isActive: res.data.isActive,
                }
              : item,
          ),
        );

        this.toast.success(
          this.lang.pick(
            nextStatus ? "تم تفعيل المنتج" : "تم تعطيل المنتج",
            nextStatus ? "Product activated" : "Product deactivated",
          ),
        );
      },

      error: () => {
        this.toast.error(
          this.lang.pick(
            "تعذر تغيير حالة المنتج",
            "Failed to change product status",
          ),
        );
      },
    });
  }

  deleteProduct(product: ProductListItem): void {
    const name = this.lang.pick(product.nameAr, product.nameEn);

    const confirmed = window.confirm(
      this.lang.pick(
        `هل أنت متأكد من حذف المنتج "${name}"؟`,
        `Are you sure you want to delete "${name}"?`,
      ),
    );

    if (!confirmed) {
      return;
    }

    this.productService.remove(product._id).subscribe({
      next: () => {
        this.products.update((list) =>
          list.filter((item) => item._id !== product._id),
        );

        this.toast.success(
          this.lang.pick("تم حذف المنتج بنجاح", "Product deleted successfully"),
        );
      },

      error: () => {
        this.toast.error(
          this.lang.pick("تعذر حذف المنتج", "Failed to delete product"),
        );
      },
    });
  }

  editProduct(product: ProductListItem): void {
    this.router.navigate(["/admin/products", product._id, "edit"]);
  }

  addProduct(): void {
    this.router.navigate(["/admin/products/new"]);
  }

  getProductTypeLabel(type: ProductType): string {
    const labels: Record<ProductType, [string, string]> = {
      supplement: ["مكمل", "Supplement"],
      protein: ["بروتين", "Protein"],
      vitamin: ["فيتامين", "Vitamin"],
      mineral: ["معادن", "Mineral"],
      preworkout: ["قبل التمرين", "Pre-workout"],
      amino: ["أحماض أمينية", "Amino"],
      hydration: ["ترطيب", "Hydration"],
      snack: ["سناك", "Snack"],
      equipment: ["معدات", "Equipment"],
      bundle: ["باقة", "Bundle"],
    };

    const value = labels[type];

    return value ? this.lang.pick(value[0], value[1]) : type;
  }

  getStockLabel(state?: string): string {
    switch (state) {
      case "in_stock":
        return this.lang.pick("متوفر", "In stock");

      case "low_stock":
        return this.lang.pick("مخزون منخفض", "Low stock");

      case "out_of_stock":
        return this.lang.pick("نفد المخزون", "Out of stock");

      default:
        return this.lang.pick("غير معروف", "Unknown");
    }
  }
}