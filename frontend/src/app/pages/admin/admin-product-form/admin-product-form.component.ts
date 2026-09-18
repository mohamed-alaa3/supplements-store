import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
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
} from "../../../core/models";

import { ProductService } from "../../../core/services/product.service";
import { CategoryService } from "../../../core/services/category.service";
import { BrandService } from "../../../core/services/brand.service";
import { LanguageService } from "../../../core/services/language.service";
import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-admin-product-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
            this.patchFormFromProduct(product.data);
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
            this.router.navigate(["/admin/products"]);
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
        next: () => {
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

          this.router.navigate(["/admin/products"]);
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

  cancel(): void {
    this.router.navigate(["/admin/products"]);
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
