import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';

import { Brand, Category, PaginationMeta, ProductListItem, ProductQueryParams } from '../../core/models';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { BrandService } from '../../core/services/brand.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RevealDirective } from '../../core/motion/reveal.directive';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type AsyncState = 'loading' | 'success' | 'empty' | 'error';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, TranslatePipe, RevealDirective,
    ProductCardComponent, LoadingSkeletonComponent, EmptyStateComponent
  ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss'
})
export class ShopComponent implements OnInit {
  products = signal<ProductListItem[]>([]);
  state = signal<AsyncState>('loading');
  meta = signal<PaginationMeta | null>(null);

  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  isFilterPanelOpen = signal(false);

  query: ProductQueryParams = { page: 1, limit: 12, sort: 'newest' };
  minPriceInput?: number;
  maxPriceInput?: number;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    public wishlist: WishlistService,
    public lang: LanguageService,
    private toast: ToastService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.list().subscribe((res) => this.categories.set(this.flattenCategories(res.data)));
    this.brandService.list().subscribe((res) => this.brands.set(res.data));

    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, queryParams]) => {
      const slug = params.get('slug');
      const search = queryParams.get('search');

      this.query = { page: 1, limit: 12, sort: 'newest' };
      if (search) this.query.search = search;
      if (slug) {
        // /category/:slug — resolve slug -> id once categories are loaded.
        this.categoryService.getBySlug(slug).subscribe({
          next: (res) => { this.query.category = res.data._id; this.fetch(); },
          error: () => this.fetch()
        });
        return;
      }
      this.fetch();
    });

    if (this.auth.isAuthenticated()) this.wishlist.refresh().subscribe();
  }

  private flattenCategories(cats: Category[]): Category[] {
    const out: Category[] = [];
    const walk = (list: Category[]) => list.forEach((c) => { out.push(c); if (c.children?.length) walk(c.children); });
    walk(cats);
    return out;
  }

  fetch(): void {
    this.state.set('loading');
    this.productService.list(this.query).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.meta.set(res.meta ?? null);
        this.state.set(res.data.length ? 'success' : 'empty');
      },
      error: () => this.state.set('error')
    });
  }

  applyFilters(): void {
    this.query.minPrice = this.minPriceInput || undefined;
    this.query.maxPrice = this.maxPriceInput || undefined;
    this.query.page = 1;
    this.fetch();
    this.isFilterPanelOpen.set(false);
  }

  clearFilters(): void {
    this.minPriceInput = undefined;
    this.maxPriceInput = undefined;
    this.query = { page: 1, limit: 12, sort: this.query.sort };
    delete this.query.category;
    delete this.query.brand;
    delete this.query.minRating;
    delete this.query.inStock;
    this.fetch();
  }

  onSortChange(sort: string): void {
    this.query.sort = sort as ProductQueryParams['sort'];
    this.fetch();
  }

  toggleCategory(id: string): void {
    this.query.category = this.query.category === id ? undefined : id;
    this.query.page = 1;
    this.fetch();
  }

  toggleBrand(id: string): void {
    this.query.brand = this.query.brand === id ? undefined : id;
    this.query.page = 1;
    this.fetch();
  }

  toggleInStock(): void {
    this.query.inStock = this.query.inStock ? undefined : true;
    this.query.page = 1;
    this.fetch();
  }

  goToPage(page: number): void {
    this.query.page = page;
    this.fetch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  pageNumbers(total: number): number[] {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  categoryName(c: Category): string { return this.lang.pick(c.nameAr, c.nameEn); }

  isWishlisted(productId: string): boolean {
    return (this.wishlist.wishlist()?.items ?? []).some((i) => i.product === productId);
  }

  onToggleWishlist(product: ProductListItem): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.error(this.lang.pick('يرجى تسجيل الدخول أولاً', 'Please log in first'));
      return;
    }
    const existing = (this.wishlist.wishlist()?.items ?? []).find((i) => i.product === product._id);
    if (existing) {
      this.wishlist.removeItem(existing._id).subscribe(() =>
        this.toast.success(this.lang.pick('تمت الإزالة من المفضلة', 'Removed from wishlist')));
    } else {
      this.wishlist.addItem({ product: product._id }).subscribe(() =>
        this.toast.success(this.lang.pick('تمت الإضافة إلى المفضلة', 'Added to wishlist')));
    }
  }
}
