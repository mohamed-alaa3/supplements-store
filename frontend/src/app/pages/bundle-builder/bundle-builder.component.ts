import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Bundle, BundleQuoteResponse, ProductListItem, ProductVariant } from '../../core/models';
import { BundleService } from '../../core/services/bundle.service';
import { ProductService } from '../../core/services/product.service';
import { VariantService } from '../../core/services/variant.service';
import { CartDrawerService } from '../../core/services/cart-drawer.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { QuantitySelectorComponent } from '../../shared/components/quantity-selector/quantity-selector.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

interface DisplayVariant {
  variant: ProductVariant;
  productName: string;
}

type AsyncState = 'loading' | 'success' | 'empty' | 'error';

/**
 * NOTE on backend coverage: Bundle.items only stores variant ObjectIds, and
 * the backend does not expose a public "get one variant by id" endpoint
 * (only PATCH/DELETE by id, both seller/admin-only). To display product
 * names/images for a bundle's configurable options, this page loads a page
 * of products + their variants and matches by id. This works for a
 * reasonably-sized catalog; a `GET /api/variants/:id` endpoint (or
 * denormalized display fields on BundleItemRule) would be more efficient
 * and is worth adding to the backend brief for a larger catalog.
 */
@Component({
  selector: 'app-bundle-builder',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, QuantitySelectorComponent, LoadingSkeletonComponent, EmptyStateComponent],
  templateUrl: './bundle-builder.component.html',
  styleUrl: './bundle-builder.component.scss'
})
export class BundleBuilderComponent implements OnInit {
  state = signal<AsyncState>('loading');
  bundles = signal<Bundle[]>([]);
  selectedBundle = signal<Bundle | null>(null);
  displayVariants = signal<Map<string, DisplayVariant>>(new Map());
  quantities = signal<Record<string, number>>({});
  quote = signal<BundleQuoteResponse | null>(null);
  quoting = signal(false);
  addingToCart = signal(false);

  constructor(
    private route: ActivatedRoute,
    private bundleService: BundleService,
    private productService: ProductService,
    private variantService: VariantService,
    private cartDrawer: CartDrawerService,
    public auth: AuthService,
    public lang: LanguageService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.bundleService.list().subscribe({
      next: (res) => {
        const configurable = res.data.filter((b) => b.bundleType === 'configurable');
        this.bundles.set(configurable);
        this.state.set(configurable.length ? 'success' : 'empty');

        const preselectId = this.route.snapshot.queryParamMap.get('bundleId');
        const preselect = configurable.find((b) => b._id === preselectId) ?? configurable[0];
        if (preselect) this.selectBundle(preselect);
      },
      error: () => this.state.set('error')
    });
  }

  selectBundle(bundle: Bundle): void {
    this.selectedBundle.set(bundle);
    this.quote.set(null);
    const initialQty: Record<string, number> = {};
    bundle.items.forEach((rule) => { initialQty[rule.variant] = rule.minQuantity || 0; });
    this.quantities.set(initialQty);
    this.loadDisplayInfo(bundle);
  }

  private loadDisplayInfo(bundle: Bundle): void {
    const neededVariantIds = new Set(bundle.items.map((i) => i.variant));
    const map = new Map<string, DisplayVariant>();

    this.productService.list({ limit: 50 }).subscribe((res) => {
      const requests = res.data.map((product) =>
        this.variantService.listForProduct(product._id).pipe(
          catchError(() => of({ success: true as const, data: [] as ProductVariant[] }))
        )
      );
      if (!requests.length) { this.displayVariants.set(map); return; }

      forkJoin(requests).subscribe((allVariants) => {
        allVariants.forEach((variantRes, idx) => {
          const product = res.data[idx];
          for (const v of variantRes.data) {
            if (neededVariantIds.has(v._id)) {
              map.set(v._id, { variant: v, productName: this.lang.pick(product.nameAr, product.nameEn) });
            }
          }
        });
        this.displayVariants.set(map);
      });
    });
  }

  setQuantity(variantId: string, qty: number): void {
    this.quantities.update((q) => ({ ...q, [variantId]: qty }));
    this.refreshQuote();
  }

  private refreshQuote(): void {
    const bundle = this.selectedBundle();
    if (!bundle) return;
    const selections = Object.entries(this.quantities())
      .filter(([, qty]) => qty > 0)
      .map(([variant, quantity]) => ({ variant, quantity }));
    if (!selections.length) { this.quote.set(null); return; }

    this.quoting.set(true);
    this.bundleService.quote(bundle._id, selections).subscribe({
      next: (res) => { this.quote.set(res.data); this.quoting.set(false); },
      error: () => this.quoting.set(false)
    });
  }

  addToCart(): void {
    const bundle = this.selectedBundle();
    if (!bundle) return;
    if (!this.auth.isAuthenticated()) {
      this.toast.error(this.lang.pick('يرجى تسجيل الدخول أولاً', 'Please log in first'));
      return;
    }
    const selections = Object.entries(this.quantities())
      .filter(([, qty]) => qty > 0)
      .map(([variant, quantity]) => ({ variant, quantity }));

    this.addingToCart.set(true);
    this.bundleService.addToCart(bundle._id, selections).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.toast.success(this.lang.pick('تمت إضافة باقتك إلى السلة', 'Your bundle was added to cart'));
        this.cartDrawer.open();
      },
      error: () => this.addingToCart.set(false)
    });
  }

  bundleName(b: Bundle): string { return this.lang.pick(b.nameAr, b.nameEn); }
}
