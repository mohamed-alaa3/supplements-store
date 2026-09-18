import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { Category, Order, OrderStatus, ProductListItem, ProductType, SellerProfile, SellerSummary } from '../../../core/models';
import { SellerService } from '../../../core/services/seller.service';
import { ProductService } from '../../../core/services/product.service';
import { VariantService } from '../../../core/services/variant.service';
import { CategoryService } from '../../../core/services/category.service';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type Tab = 'overview' | 'products' | 'orders';
const PRODUCT_TYPES: ProductType[] = ['supplement', 'protein', 'vitamin', 'mineral', 'preworkout', 'amino', 'hydration', 'snack', 'equipment', 'bundle'];
// The backend's seller-scoped status endpoint only accepts this subset
// (see backend/validators/status.validators.js -> sellerOrderStatusRules).
// A seller can never set "pending", "cancelled" or "returned" directly —
// offering those in the dropdown would just get rejected by the API.
const ORDER_STATUSES: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LoadingSkeletonComponent, EmptyStateComponent],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.scss'
})
export class SellerDashboardComponent implements OnInit {
  tab = signal<Tab>('overview');
  profile = signal<SellerProfile | null>(null);
  summary = signal<SellerSummary | null>(null);
  products = signal<ProductListItem[]>([]);
  orders = signal<Order[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  showNewProductForm = signal(false);
  savingProduct = signal(false);

  readonly productTypes = PRODUCT_TYPES;
  readonly orderStatuses = ORDER_STATUSES;

  newProduct = { nameAr: '', nameEn: '', category: '', productType: 'supplement' as ProductType, basePrice: 0 };
  newVariant = { sku: '', price: 0, flavor: '', sizeLabel: '' };
  productForVariant = signal<ProductListItem | null>(null);

  constructor(
    private sellerService: SellerService,
    private productService: ProductService,
    private variantService: VariantService,
    private categoryService: CategoryService,
    public lang: LanguageService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.sellerService.getMyProfile().subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.loading.set(false);
        this.loadProducts();
      },
      error: () => this.loading.set(false)
    });
    this.sellerService.getMySummary().subscribe((res) => this.summary.set(res.data));
    this.categoryService.list().subscribe((res) => this.categories.set(this.flatten(res.data)));
  }

  private flatten(cats: Category[]): Category[] {
    const out: Category[] = [];
    const walk = (list: Category[]) => list.forEach((c) => { out.push(c); if (c.children?.length) walk(c.children); });
    walk(cats);
    return out;
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'orders' && this.orders().length === 0) this.loadOrders();
  }

  private loadProducts(): void {
    const sellerId = this.profile()?._id;
    if (!sellerId) return;
    this.productService.list({ seller: sellerId, limit: 50 }).subscribe((res) => this.products.set(res.data));
  }

  private loadOrders(): void {
    this.sellerService.getMyOrders().subscribe((res) => this.orders.set(res.data));
  }

  createProduct(form: NgForm): void {
    if (form.invalid) return;
    this.savingProduct.set(true);
    this.productService.create(this.newProduct).subscribe({
      next: (res) => {
        this.products.update((list) => [res.data, ...list]);
        this.savingProduct.set(false);
        this.showNewProductForm.set(false);
        this.newProduct = { nameAr: '', nameEn: '', category: '', productType: 'supplement', basePrice: 0 };
        this.toast.success(this.lang.pick('تمت إضافة المنتج', 'Product created'));
      },
      error: () => this.savingProduct.set(false)
    });
  }

  toggleProductStatus(product: ProductListItem): void {
    this.productService.setStatus(product._id, !product.isActive).subscribe((res) => {
      this.products.update((list) => list.map((p) => (p._id === product._id ? { ...p, isActive: res.data.isActive } : p)));
    });
  }

  openVariantForm(product: ProductListItem): void {
    this.productForVariant.set(product);
    this.newVariant = { sku: '', price: product.basePrice, flavor: '', sizeLabel: '' };
  }

  addVariant(form: NgForm): void {
    const product = this.productForVariant();
    if (!product || form.invalid) return;
    this.variantService.create(product._id, { ...this.newVariant, isDefault: true, isActive: true }).subscribe({
      next: () => {
        this.productForVariant.set(null);
        this.toast.success(this.lang.pick('تمت إضافة الخيار', 'Variant added'));
      }
    });
  }

  updateOrderStatus(order: Order, status: OrderStatus): void {
    this.sellerService.updateOrderStatus(order._id, status).subscribe((res) => {
      this.orders.update((list) => list.map((o) => (o._id === order._id ? res.data : o)));
    });
  }

  categoryName(c: Category): string { return this.lang.pick(c.nameAr, c.nameEn); }
}
