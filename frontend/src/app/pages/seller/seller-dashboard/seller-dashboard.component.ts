import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Category, Order, OrderStatus, ProductListItem, ProductType, SellerProfile, SellerSummary } from '../../../core/models';
import { SellerService } from '../../../core/services/seller.service';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { VariantManagerComponent } from '../../../shared/components/variant-manager/variant-manager.component';

type Tab = 'overview' | 'products' | 'orders';
const PRODUCT_TYPES: ProductType[] = ['supplement', 'protein', 'vitamin', 'mineral', 'preworkout', 'amino', 'hydration', 'snack', 'equipment', 'bundle'];
const ORDER_STATUSES: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LoadingSkeletonComponent, EmptyStateComponent, VariantManagerComponent],
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
  variantProduct = signal<ProductListItem | null>(null);

  readonly productTypes = PRODUCT_TYPES;
  readonly orderStatuses = ORDER_STATUSES;

  constructor(
    private sellerService: SellerService,
    private productService: ProductService,
    private categoryService: CategoryService,
    public lang: LanguageService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load the seller profile first. This prevents the dashboard from firing
    // seller-scoped requests before the current seller profile is confirmed.
    this.sellerService.getMyProfile().subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.loading.set(false);
        this.loadProducts();
        this.loadSummary();
        this.loadCategories();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error(this.lang.pick('تعذر تحميل بيانات البائع', 'Could not load seller profile'));
      }
    });
  }

  private loadSummary(): void {
    this.sellerService.getMySummary().subscribe({
      next: (res) => this.summary.set(res.data),
      error: () => this.summary.set(null)
    });
  }

  private loadCategories(): void {
    this.categoryService.list().subscribe({
      next: (res) => this.categories.set(this.flatten(res.data ?? [])),
      error: () => this.categories.set([])
    });
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
    this.productService.list({ seller: sellerId, limit: 100 }).subscribe({
      next: (res) => this.products.set(res.data ?? []),
      error: () => this.products.set([])
    });
  }

  private loadOrders(): void {
    this.sellerService.getMyOrders().subscribe({
      next: (res) => this.orders.set(res.data ?? []),
      error: () => this.orders.set([])
    });
  }

  newProduct(): void {
    this.router.navigate(['/seller/products/new']);
  }

  editProduct(product: ProductListItem): void {
    this.router.navigate(['/seller/products', product._id, 'edit']);
  }

  toggleVariants(product: ProductListItem): void {
    this.variantProduct.set(this.variantProduct()?._id === product._id ? null : product);
  }

  toggleProductStatus(product: ProductListItem): void {
    // Seller ownership is enforced by the backend PATCH /products/:id route.
    // Do not call the admin-only /status endpoint here.
    this.productService.update(product._id, { isActive: !product.isActive }).subscribe({
      next: (res) => {
        this.products.update((list) => list.map((p) => p._id === product._id ? { ...p, isActive: res.data.isActive } : p));
        this.toast.success(this.lang.pick(
          res.data.isActive ? 'تم تفعيل المنتج' : 'تم تعطيل المنتج',
          res.data.isActive ? 'Product activated' : 'Product deactivated'
        ));
      },
      error: () => this.toast.error(this.lang.pick('تعذر تغيير حالة المنتج', 'Failed to change product status'))
    });
  }

  updateOrderStatus(order: Order, status: OrderStatus): void {
    this.sellerService.updateOrderStatus(order._id, status).subscribe({
      next: (res) => this.orders.update((list) => list.map((o) => o._id === order._id ? res.data : o)),
      error: () => this.toast.error(this.lang.pick('تعذر تحديث حالة الطلب', 'Failed to update order status'))
    });
  }

  categoryName(c: Category): string { return this.lang.pick(c.nameAr, c.nameEn); }

  productTypeLabel(type: ProductType): string {
    const labels: Record<ProductType, [string, string]> = {
      supplement: ['مكمل', 'Supplement'], protein: ['بروتين', 'Protein'], vitamin: ['فيتامين', 'Vitamin'],
      mineral: ['معادن', 'Mineral'], preworkout: ['قبل التمرين', 'Pre-workout'], amino: ['أحماض أمينية', 'Amino'],
      hydration: ['ترطيب', 'Hydration'], snack: ['سناك', 'Snack'], equipment: ['معدات', 'Equipment'], bundle: ['باقة', 'Bundle']
    };
    return this.lang.pick(labels[type][0], labels[type][1]);
  }

  statusLabel(active: boolean): string { return this.lang.pick(active ? 'نشط' : 'غير نشط', active ? 'Active' : 'Inactive'); }
}
