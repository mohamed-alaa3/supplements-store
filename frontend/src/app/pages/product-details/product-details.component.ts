import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import gsap from 'gsap';
import Swiper from 'swiper';
import { Thumbs, FreeMode, Navigation } from 'swiper/modules';

import { ProductImage, ProductListItem, ProductVariant, Review, StockState } from '../../core/models';
import { ProductService } from '../../core/services/product.service';
import { VariantService } from '../../core/services/variant.service';
import { ReviewService } from '../../core/services/review.service';
import { CartService } from '../../core/services/cart.service';
import { CartDrawerService } from '../../core/services/cart-drawer.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { MotionService } from '../../core/services/motion.service';
import { ToastService } from '../../core/services/toast.service';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RevealDirective } from '../../core/motion/reveal.directive';
import { RatingComponent } from '../../shared/components/rating/rating.component';
import { PriceTagComponent } from '../../shared/components/price-tag/price-tag.component';
import { StockBadgeComponent } from '../../shared/components/stock-badge/stock-badge.component';
import { QuantitySelectorComponent } from '../../shared/components/quantity-selector/quantity-selector.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MediaUrlPipe } from '../../core/pipes/media-url.pipe';

type AsyncState = 'loading' | 'success' | 'empty' | 'error';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, TranslatePipe, RevealDirective,
    RatingComponent, PriceTagComponent, StockBadgeComponent, QuantitySelectorComponent,
    LoadingSkeletonComponent, EmptyStateComponent, MediaUrlPipe
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  @ViewChild('mainSwiperEl') mainSwiperEl?: ElementRef<HTMLElement>;
  @ViewChild('thumbSwiperEl') thumbSwiperEl?: ElementRef<HTMLElement>;
  @ViewChild('buyBox') buyBox?: ElementRef<HTMLElement>;

  state = signal<AsyncState>('loading');
  product = signal<ProductListItem | null>(null);
  images = signal<ProductImage[]>([]);
  variants = signal<ProductVariant[]>([]);
  selectedVariant = signal<ProductVariant | null>(null);
  quantity = signal(1);

  reviewsState = signal<AsyncState>('loading');
  reviews = signal<Review[]>([]);
  reviewForm = { rating: 5, title: '', comment: '' };
  submittingReview = signal(false);

  addingToCart = signal(false);

  private mainSwiper?: Swiper;
  private thumbSwiper?: Swiper;
  private productId = '';

  readonly effectivePrice = computed(() => {
    const p = this.product();
    const v = this.selectedVariant();
    if (!p || !v) return 0;
    if (p.discountType === 'percentage') return v.price * (1 - p.discountValue / 100);
    if (p.discountType === 'fixed') return Math.max(0, v.price - p.discountValue);
    return v.price;
  });

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private variantService: VariantService,
    private reviewService: ReviewService,
    public cart: CartService,
    private cartDrawer: CartDrawerService,
    public wishlist: WishlistService,
    public auth: AuthService,
    public lang: LanguageService,
    private motion: MotionService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.productId = id;
      this.load(id);
    });

    if (this.auth.isAuthenticated()) this.wishlist.refresh().subscribe();
  }

  private load(id: string): void {
    this.state.set('loading');
    this.reviewsState.set('loading');

    forkJoin({
      product: this.productService.getById(id),
      images: this.productService.getImages(id),
      variants: this.variantService.listForProduct(id)
    }).subscribe({
      next: ({ product, images, variants }) => {
        this.product.set(product.data);
        this.images.set(images.data);
        this.variants.set(variants.data);

        const initial = variants.data.find((v) => v.isDefault) ?? variants.data[0] ?? null;
        this.selectedVariant.set(initial);

        this.state.set('success');
        setTimeout(() => {
          this.initGallery();
          this.playEntrance();
        }, 0);
      },
      error: () => this.state.set('error')
    });

    this.reviewService.listForProduct(id).subscribe({
      next: (res) => { this.reviews.set(res.data); this.reviewsState.set(res.data.length ? 'success' : 'empty'); },
      error: () => this.reviewsState.set('error')
    });
  }

  private playEntrance(): void {
    const box = this.buyBox?.nativeElement;
    if (!box || !this.motion.canAnimate()) return;
    gsap.fromTo(box, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
  }

  private initGallery(): void {
    const mainEl = this.mainSwiperEl?.nativeElement;
    const thumbEl = this.thumbSwiperEl?.nativeElement;
    if (!mainEl) return;

    this.thumbSwiper?.destroy(true, true);
    this.mainSwiper?.destroy(true, true);

    if (thumbEl) {
      this.thumbSwiper = new Swiper(thumbEl, {
        modules: [FreeMode],
        slidesPerView: 4.5,
        spaceBetween: 10,
        freeMode: true,
        watchSlidesProgress: true
      });
    }

    this.mainSwiper = new Swiper(mainEl, {
      modules: [Thumbs, Navigation],
      navigation: { nextEl: '.pd-gallery__next', prevEl: '.pd-gallery__prev' },
      thumbs: this.thumbSwiper ? { swiper: this.thumbSwiper } : undefined,
      speed: this.motion.canAnimate() ? 350 : 0,
      a11y: { enabled: true }
    });
  }

  productName(): string {
    const p = this.product();
    return p ? this.lang.pick(p.nameAr, p.nameEn) : '';
  }

  productDescription(): string {
    const p = this.product();
    return p ? this.lang.pick(p.descriptionAr, p.descriptionEn) ?? '' : '';
  }

  selectVariant(v: ProductVariant): void {
    this.selectedVariant.set(v);
  }

  get selectedStockState(): StockState {
    return this.selectedVariant()?.stockState ?? 'out_of_stock';
  }

  addToCart(): void {
    const variant = this.selectedVariant();
    if (!variant) return;

    if (!this.auth.isAuthenticated()) {
      this.toast.error(this.lang.pick('يرجى تسجيل الدخول لإضافة منتجات إلى السلة', 'Please log in to add items to your cart'));
      return;
    }

    this.addingToCart.set(true);
    this.cart.addItem({ variant: variant._id, quantity: this.quantity() }).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.toast.success(this.lang.pick('تمت الإضافة إلى السلة', 'Added to cart'));
        this.cartDrawer.open();
      },
      error: () => this.addingToCart.set(false)
    });
  }

  isWishlisted(): boolean {
    const p = this.product();
    if (!p) return false;
    return (this.wishlist.wishlist()?.items ?? []).some((i) => i.product === p._id);
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    if (!this.auth.isAuthenticated()) {
      this.toast.error(this.lang.pick('يرجى تسجيل الدخول أولاً', 'Please log in first'));
      return;
    }
    const existing = (this.wishlist.wishlist()?.items ?? []).find((i) => i.product === p._id);
    if (existing) {
      this.wishlist.removeItem(existing._id).subscribe(() => this.toast.success(this.lang.pick('تمت الإزالة من المفضلة', 'Removed from wishlist')));
    } else {
      this.wishlist.addItem({ product: p._id }).subscribe(() => this.toast.success(this.lang.pick('تمت الإضافة إلى المفضلة', 'Added to wishlist')));
    }
  }

  submitReview(): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.error(this.lang.pick('يرجى تسجيل الدخول لإضافة تقييم', 'Please log in to leave a review'));
      return;
    }
    // The backend only accepts reviews from the "customer" role
    // (see backend/routes/product.routes.js -> authorize('customer')).
    if (this.auth.role() !== 'customer') {
      this.toast.error(this.lang.pick('حسابات البائعين والإدارة لا يمكنها إضافة تقييمات', 'Seller and admin accounts cannot leave reviews'));
      return;
    }
    if (!this.reviewForm.comment.trim()) return;

    this.submittingReview.set(true);
    this.reviewService.create(this.productId, {
      rating: this.reviewForm.rating,
      title: this.reviewForm.title || undefined,
      comment: this.reviewForm.comment
    }).subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.reviewForm = { rating: 5, title: '', comment: '' };
        this.toast.success(this.lang.pick('شكرًا لتقييمك! سيظهر بعد المراجعة.', 'Thanks for your review! It will appear after moderation.'));
      },
      error: () => {
        this.submittingReview.set(false);
        this.toast.error(this.lang.pick('تعذر إرسال تقييمك', 'Failed to submit your review'));
      }
    });
  }
}
