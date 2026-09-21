import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { finalize, forkJoin, of } from "rxjs";

import {
  Brand,
  Category,
  DiscountType,
  ProductListItem,
  ProductPayload,
  ProductType,
  ProductImage,
} from "../../../core/models";
import { VariantManagerComponent } from '../../../shared/components/variant-manager/variant-manager.component';

import { ProductService } from "../../../core/services/product.service";
import { CategoryService } from "../../../core/services/category.service";
import { BrandService } from "../../../core/services/brand.service";
import { LanguageService } from "../../../core/services/language.service";
import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-admin-product-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, VariantManagerComponent],
  templateUrl: "./admin-product-form.component.html",
  styleUrl: "./admin-product-form.component.scss",
})
export class AdminProductFormComponent implements OnInit {
  form!: FormGroup;

  categories: Category[] = [];
  brands: Brand[] = [];

  loading = true;
  saving = false;

  /** Present (and non-null) when this page was opened as /admin/products/:id/edit. */
  private productId: string | null = null;
  /** Same full form is intentionally shared by admin and seller product management. */
  isSellerMode = false;
  loadedProduct: ProductListItem | null = null;
  productImages: ProductImage[] = [];
  imageUrl = "";
  imageAltAr = "";
  imageAltEn = "";
  imageIsPrimary = false;
  addingImage = false;
  get isEditMode(): boolean {
    return this.productId !== null;
  }

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

  readonly discountTypes: DiscountType[] = ["none", "percentage", "fixed"];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    public lang: LanguageService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get("id");
    this.isSellerMode = this.router.url.startsWith("/seller/");
    this.buildForm();
    this.loadOptions();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nameAr: ["", [Validators.required, Validators.minLength(2)]],
      nameEn: ["", [Validators.required, Validators.minLength(2)]],

      shortDescriptionAr: [""],
      shortDescriptionEn: [""],

      descriptionAr: [""],
      descriptionEn: [""],

      category: ["", Validators.required],
      brand: [""],

      productType: ["supplement", Validators.required],

      basePrice: [null, [Validators.required, Validators.min(0)]],

      compareAtPrice: [null, [Validators.min(0)]],

      discountType: ["none", Validators.required],

      discountValue: [0, [Validators.min(0)]],

      tags: [""],

      isFeatured: [false],
      isBestSeller: [false],
    });
  }

  private loadOptions(): void {
    this.loading = true;

    forkJoin({
      categories: this.categoryService.list(),
      brands: this.brandService.list(),
      product: this.productId
        ? this.productService.getById(this.productId)
        : of(null),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ categories, brands, product }) => {
          this.categories = (categories.data ?? []).filter(
            (category) => category.isActive,
          );

          this.brands = (brands.data ?? []).filter((brand) => brand.isActive);

          if (product) {
            this.loadedProduct = product.data;
            this.patchFormFromProduct(product.data);
            this.loadProductImages();
          }
        },

        error: () => {
          this.toast.error(
            this.isEditMode
              ? this.lang.pick(
                  "تعذر تحميل بيانات المنتج",
                  "Failed to load the product",
                )
              : this.lang.pick(
                  "تعذر تحميل التصنيفات والعلامات التجارية",
                  "Failed to load categories and brands",
                ),
          );

          if (this.isEditMode) {
            this.router.navigate(this.isSellerMode ? ["/seller"] : ["/admin/products"]);
          }
        },
      });
  }

  private patchFormFromProduct(product: ProductListItem): void {
    const category =
      typeof product.category === "object"
        ? product.category?._id
        : product.category;

    const brand =
      typeof product.brand === "object" ? product.brand?._id : product.brand;

    this.form.patchValue({
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      shortDescriptionAr: product.shortDescriptionAr ?? "",
      shortDescriptionEn: product.shortDescriptionEn ?? "",
      descriptionAr: product.descriptionAr ?? "",
      descriptionEn: product.descriptionEn ?? "",
      category: category ?? "",
      brand: brand ?? "",
      productType: product.productType,
      basePrice: product.basePrice,
      compareAtPrice: product.compareAtPrice ?? null,
      discountType: product.discountType,
      discountValue: product.discountValue ?? 0,
      tags: (product.tags ?? []).join(", "),
      isFeatured: product.isFeatured,
      isBestSeller: product.isBestSeller,
    });
  }

  get isDiscounted(): boolean {
    return this.form.get("discountType")?.value !== "none";
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.toast.error(
        this.lang.pick(
          "من فضلك أكمل البيانات المطلوبة",
          "Please complete the required fields",
        ),
      );

      return;
    }

    this.saving = true;

    const value = this.form.value;

    const payload: ProductPayload = {
      nameAr: value.nameAr.trim(),
      nameEn: value.nameEn.trim(),

      shortDescriptionAr: value.shortDescriptionAr?.trim() || undefined,

      shortDescriptionEn: value.shortDescriptionEn?.trim() || undefined,

      descriptionAr: value.descriptionAr?.trim() || undefined,

      descriptionEn: value.descriptionEn?.trim() || undefined,

      category: value.category,

      brand: value.brand || undefined,

      productType: value.productType,

      basePrice: Number(value.basePrice),

      compareAtPrice:
        value.compareAtPrice !== null && value.compareAtPrice !== ""
          ? Number(value.compareAtPrice)
          : undefined,

      discountType: value.discountType,

      discountValue:
        value.discountType === "none" ? 0 : Number(value.discountValue || 0),

      tags: this.parseTags(value.tags),

      isFeatured: Boolean(value.isFeatured),

      isBestSeller: Boolean(value.isBestSeller),
    };

    const request$ = this.isEditMode
      ? this.productService.update(this.productId as string, payload)
      : this.productService.create(payload);

    request$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (res) => {
          const savedProduct = res.data as ProductListItem;

          this.toast.success(
            this.isEditMode
              ? this.lang.pick(
                  "تم تحديث المنتج بنجاح",
                  "Product updated successfully",
                )
              : this.lang.pick(
                  "تم إضافة المنتج بنجاح",
                  "Product created successfully",
                ),
          );

          // A new product must exist before variants can be attached to it.
          // After creation, open the edit screen so the seller/admin can add
          // variants, images, and any remaining product management data.
          if (!this.isEditMode && savedProduct?._id) {
            this.router.navigate(
              this.isSellerMode
                ? ["/seller/products", savedProduct._id, "edit"]
                : ["/admin/products", savedProduct._id, "edit"],
            );
            return;
          }

          this.router.navigate(this.isSellerMode ? ["/seller"] : ["/admin/products"]);
        },

        error: () => {
          this.toast.error(
            this.isEditMode
              ? this.lang.pick("تعذر تحديث المنتج", "Failed to update product")
              : this.lang.pick("تعذر إضافة المنتج", "Failed to create product"),
          );
        },
      });
  }

  private parseTags(value: string): string[] {
    if (!value?.trim()) {
      return [];
    }

    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  loadProductImages(): void {
    if (!this.productId) return;
    this.productService.getImages(this.productId).subscribe({
      next: (res) => (this.productImages = res.data ?? []),
      error: () => this.toast.error(this.lang.pick("تعذر تحميل صور المنتج", "Failed to load product images")),
    });
  }

  addProductImage(): void {
    if (!this.productId || !this.imageUrl.trim()) return;
    try {
      const url = new URL(this.imageUrl.trim());
      if (!/^https?:$/.test(url.protocol)) throw new Error();
    } catch {
      this.toast.error(this.lang.pick("أدخل رابط صورة صحيح من Cloudinary", "Enter a valid Cloudinary image URL"));
      return;
    }

    this.addingImage = true;
    this.productService.addImage(this.productId, {
      url: this.imageUrl.trim(),
      altAr: this.imageAltAr.trim() || undefined,
      altEn: this.imageAltEn.trim() || undefined,
      isPrimary: this.imageIsPrimary || this.productImages.length === 0,
    }).pipe(finalize(() => (this.addingImage = false))).subscribe({
      next: (res) => {
        if (res.data) {
          this.productImages = this.imageIsPrimary
            ? [res.data, ...this.productImages.map((image) => ({ ...image, isPrimary: false }))]
            : [...this.productImages, res.data];
        }
        this.imageUrl = "";
        this.imageAltAr = "";
        this.imageAltEn = "";
        this.imageIsPrimary = false;
        this.toast.success(this.lang.pick("تمت إضافة الصورة", "Image added"));
      },
      error: () => this.toast.error(this.lang.pick("تعذر إضافة الصورة", "Failed to add image")),
    });
  }

  deleteProductImage(imageId: string): void {
    if (!this.productId) return;
    this.productService.deleteImage(this.productId, imageId).subscribe({
      next: () => {
        this.productImages = this.productImages.filter((image) => image._id !== imageId);
        if (this.productImages.length && !this.productImages.some((image) => image.isPrimary)) {
          this.productImages[0] = { ...this.productImages[0], isPrimary: true };
        }
        this.toast.success(this.lang.pick("تم حذف الصورة", "Image removed"));
      },
      error: () => this.toast.error(this.lang.pick("تعذر حذف الصورة", "Failed to remove image")),
    });
  }

  cancel(): void {
    this.router.navigate(this.isSellerMode ? ["/seller"] : ["/admin/products"]);
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);

    return Boolean(
      control && control.invalid && (control.dirty || control.touched),
    );
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

  getDiscountTypeLabel(type: DiscountType): string {
    const labels: Record<DiscountType, [string, string]> = {
      none: ["بدون خصم", "No discount"],
      percentage: ["نسبة مئوية", "Percentage"],
      fixed: ["قيمة ثابتة", "Fixed amount"],
    };

    const value = labels[type];

    return value ? this.lang.pick(value[0], value[1]) : type;
  }
}
