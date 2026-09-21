import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
} from "@angular/core";

import { RouterLink } from "@angular/router";

import gsap from "gsap";
import Swiper from "swiper";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import { ProductListItem, Category, Bundle, Banner } from "../../core/models";

import { ProductService } from "../../core/services/product.service";
import { CategoryService } from "../../core/services/category.service";
import { BundleService } from "../../core/services/bundle.service";
import { BannerService } from "../../core/services/banner.service";
import { WishlistService } from "../../core/services/wishlist.service";
import { LanguageService } from "../../core/services/language.service";
import { MotionService } from "../../core/services/motion.service";
import { ToastService } from "../../core/services/toast.service";
import { AuthService } from "../../core/services/auth.service";

import { TranslatePipe } from "../../core/i18n/translate.pipe";
import { RevealDirective } from "../../core/motion/reveal.directive";

import { ProductCardComponent } from "../../shared/components/product-card/product-card.component";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";
import { LoadingSkeletonComponent } from "../../shared/components/loading-skeleton/loading-skeleton.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { MediaUrlPipe } from "../../core/pipes/media-url.pipe";

type AsyncState = "loading" | "success" | "empty" | "error";

@Component({
  selector: "app-home",
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    RevealDirective,
    ProductCardComponent,
    SectionHeaderComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    MediaUrlPipe,
  ],

  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild("heroEyebrow")
  heroEyebrow?: ElementRef<HTMLElement>;

  @ViewChild("heroTitle")
  heroTitle?: ElementRef<HTMLElement>;

  @ViewChild("heroSubtitle")
  heroSubtitle?: ElementRef<HTMLElement>;

  @ViewChild("heroCta")
  heroCta?: ElementRef<HTMLElement>;

  @ViewChild("heroMedia")
  heroMedia?: ElementRef<HTMLElement>;

  @ViewChild("bannerSwiperEl")
  bannerSwiperEl?: ElementRef<HTMLElement>;

  /* ------------------------------------------------------------------------
     State
  ------------------------------------------------------------------------ */

  banners = signal<Banner[]>([]);
  bannerState = signal<AsyncState>("loading");

  featured = signal<ProductListItem[]>([]);
  featuredState = signal<AsyncState>("loading");

  bestSellers = signal<ProductListItem[]>([]);
  bestSellersState = signal<AsyncState>("loading");

  categories = signal<Category[]>([]);
  categoriesState = signal<AsyncState>("loading");

  bundles = signal<Bundle[]>([]);
  bundlesState = signal<AsyncState>("loading");

  private bannerSwiper?: Swiper;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private bundleService: BundleService,
    private bannerService: BannerService,
    public wishlist: WishlistService,
    public lang: LanguageService,
    private motion: MotionService,
    private toast: ToastService,
    public auth: AuthService,
  ) {}

  /* ------------------------------------------------------------------------
     Lifecycle
  ------------------------------------------------------------------------ */

  ngOnInit(): void {
    this.loadBanners();
    this.loadFeatured();
    this.loadBestSellers();
    this.loadCategories();
    this.loadBundles();

    if (this.auth.isAuthenticated()) {
      this.wishlist.refresh().subscribe();
    }

    setTimeout(() => {
      this.playHeroEntrance();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.bannerSwiper) {
      this.bannerSwiper.destroy(true, true);
      this.bannerSwiper = undefined;
    }
  }

  /* ------------------------------------------------------------------------
     Hero animation
  ------------------------------------------------------------------------ */

  private playHeroEntrance(): void {
    const nodes = [
      this.heroEyebrow,
      this.heroTitle,
      this.heroSubtitle,
      this.heroCta,
      this.heroMedia,
    ]
      .map((ref) => ref?.nativeElement)
      .filter(Boolean) as HTMLElement[];

    if (!nodes.length) {
      return;
    }

    if (!this.motion.canAnimate()) {
      gsap.set(nodes, {
        opacity: 1,
        y: 0,
        scale: 1,
      });

      return;
    }

    const tl = gsap.timeline({
      defaults: {
        ease: "power3.out",
      },
    });

    gsap.set(nodes, {
      opacity: 0,
    });

    if (this.heroEyebrow) {
      tl.fromTo(
        this.heroEyebrow.nativeElement,
        { y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
        },
      );
    }

    if (this.heroTitle) {
      tl.fromTo(
        this.heroTitle.nativeElement,
        { y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
        },
        "-=0.25",
      );
    }

    if (this.heroSubtitle) {
      tl.fromTo(
        this.heroSubtitle.nativeElement,
        { y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
        },
        "-=0.4",
      );
    }

    if (this.heroCta) {
      tl.fromTo(
        this.heroCta.nativeElement,
        { y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
        },
        "-=0.35",
      );
    }

    if (this.heroMedia) {
      tl.fromTo(
        this.heroMedia.nativeElement,
        {
          opacity: 0,
          scale: 1.06,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.9,
        },
        "-=0.9",
      );
    }
  }

  /* ------------------------------------------------------------------------
     Banners
  ------------------------------------------------------------------------ */

  private loadBanners(): void {
    this.bannerService.list().subscribe({
      next: (res) => {
        this.banners.set(res.data);

        this.bannerState.set(res.data.length ? "success" : "empty");

        if (res.data.length) {
          setTimeout(() => {
            this.initBannerSwiper();
          }, 0);
        }
      },

      error: () => {
        this.bannerState.set("error");
      },
    });
  }

  private initBannerSwiper(): void {
    const el = this.bannerSwiperEl?.nativeElement;

    if (!el) {
      return;
    }

    this.bannerSwiper?.destroy(true, true);

    this.bannerSwiper = new Swiper(el, {
      modules: [Autoplay, Pagination, Navigation],

      loop: this.banners().length > 1,

      autoplay: this.motion.canAnimate()
        ? {
            delay: 5500,
            disableOnInteraction: false,
          }
        : false,

      speed: 700,

      pagination: {
        el: ".hero-banners__pagination",
        clickable: true,
      },

      navigation: {
        nextEl: ".hero-banners__next",
        prevEl: ".hero-banners__prev",
      },

      a11y: {
        enabled: true,
      },

      observer: true,
      observeParents: true,
    });
  }

  /* ------------------------------------------------------------------------
     Featured
  ------------------------------------------------------------------------ */

  private loadFeatured(): void {
    this.productService
      .list({
        featured: true,
        limit: 8,
        sort: "newest",
      })
      .subscribe({
        next: (res) => {
          this.featured.set(res.data);

          this.featuredState.set(res.data.length ? "success" : "empty");
        },

        error: () => {
          this.featuredState.set("error");
        },
      });
  }

  /* ------------------------------------------------------------------------
     Best Sellers
  ------------------------------------------------------------------------ */

  private loadBestSellers(): void {
    this.productService
      .list({
        bestSeller: true,
        limit: 8,
        sort: "rating",
      })
      .subscribe({
        next: (res) => {
          this.bestSellers.set(res.data);

          this.bestSellersState.set(res.data.length ? "success" : "empty");
        },

        error: () => {
          this.bestSellersState.set("error");
        },
      });
  }

  /* ------------------------------------------------------------------------
     Categories
  ------------------------------------------------------------------------ */

  private loadCategories(): void {
    this.categoryService.list().subscribe({
      next: (res) => {
        this.categories.set(res.data.slice(0, 6));

        this.categoriesState.set(res.data.length ? "success" : "empty");
      },

      error: () => {
        this.categoriesState.set("error");
      },
    });
  }

  /* ------------------------------------------------------------------------
     Bundles
  ------------------------------------------------------------------------ */

  private loadBundles(): void {
    this.bundleService.list().subscribe({
      next: (res) => {
        this.bundles.set(res.data.slice(0, 4));

        this.bundlesState.set(res.data.length ? "success" : "empty");
      },

      error: () => {
        this.bundlesState.set("error");
      },
    });
  }

  /* ------------------------------------------------------------------------
     Retry
  ------------------------------------------------------------------------ */

  retryFeatured(): void {
    this.featuredState.set("loading");
    this.loadFeatured();
  }

  retryBestSellers(): void {
    this.bestSellersState.set("loading");
    this.loadBestSellers();
  }

  retryCategories(): void {
    this.categoriesState.set("loading");
    this.loadCategories();
  }

  retryBundles(): void {
    this.bundlesState.set("loading");
    this.loadBundles();
  }

  retryBanners(): void {
    this.bannerState.set("loading");
    this.loadBanners();
  }

  /* ------------------------------------------------------------------------
     Wishlist
  ------------------------------------------------------------------------ */

  isWishlisted(productId: string): boolean {
    return (this.wishlist.wishlist()?.items ?? []).some(
      (item) => item.product === productId,
    );
  }

  onToggleWishlist(product: ProductListItem): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.error(
        this.lang.pick("يرجى تسجيل الدخول أولاً", "Please log in first"),
      );

      return;
    }

    const existing = (this.wishlist.wishlist()?.items ?? []).find(
      (item) => item.product === product._id,
    );

    if (existing) {
      this.wishlist.removeItem(existing._id).subscribe(() => {
        this.toast.success(
          this.lang.pick("تمت الإزالة من المفضلة", "Removed from wishlist"),
        );
      });
    } else {
      this.wishlist
        .addItem({
          product: product._id,
        })
        .subscribe(() => {
          this.toast.success(
            this.lang.pick("تمت الإضافة إلى المفضلة", "Added to wishlist"),
          );
        });
    }
  }

  /* ------------------------------------------------------------------------
     Localization
  ------------------------------------------------------------------------ */

  bundleName(bundle: Bundle): string {
    return this.lang.pick(bundle.nameAr, bundle.nameEn);
  }

  categoryName(category: Category): string {
    return this.lang.pick(category.nameAr, category.nameEn);
  }

  bannerTitle(banner: Banner): string {
    return this.lang.pick(banner.titleAr, banner.titleEn);
  }

  bannerSubtitle(banner: Banner): string {
    return this.lang.pick(banner.subtitleAr, banner.subtitleEn) ?? "";
  }
}
