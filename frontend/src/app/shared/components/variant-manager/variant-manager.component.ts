import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductVariant, VariantPayload } from '../../../core/models';
import { VariantService } from '../../../core/services/variant.service';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

interface VariantDraft {
  sku: string; price: number; compareAtPrice?: number; flavor: string; sizeLabel: string;
  sizeValue?: number; sizeUnit?: 'g' | 'kg'; servings?: number; scoops?: number;
  stockQuantity: number; lowStockThreshold: number; trackInventory: boolean;
}

@Component({
  selector: 'app-variant-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './variant-manager.component.html',
  styleUrl: './variant-manager.component.scss'
})
export class VariantManagerComponent implements OnInit {
  @Input({ required: true }) productId!: string;
  @Input() basePrice = 0;

  variants = signal<ProductVariant[]>([]);
  loading = signal(true);
  saving = signal(false);
  editingId = signal<string | null>(null);
  showForm = signal(false);
  draft: VariantDraft = this.emptyDraft();

  constructor(private variantsApi: VariantService, public lang: LanguageService, private toast: ToastService) {}

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.loading.set(true);
    this.variantsApi.listForProduct(this.productId).subscribe({
      next: res => { this.variants.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  startNew(): void {
    this.editingId.set(null);
    this.draft = this.emptyDraft();
    this.showForm.set(true);
  }

  flavorIcon(flavor?: string | null): string {
    const value = (flavor ?? '').trim().toLocaleLowerCase();
    if (!value) return '';
    const matches = (terms: string[]) => terms.some((term) => value.includes(term));
    if (matches(['chocolate', 'choco', 'شوكولات', 'كاكاو'])) return '🍫';
    if (matches(['vanilla', 'فانيلا', 'فانيليا'])) return '🌼';
    if (matches(['strawberry', 'فراولة'])) return '🍓';
    if (matches(['banana', 'موز'])) return '🍌';
    if (matches(['caramel', 'كراميل'])) return '🍮';
    if (matches(['cookie', 'cookies', 'بسكويت', 'كوكيز'])) return '🍪';
    if (matches(['coffee', 'cafe', 'قهوة', 'نسكافيه', 'mocha', 'موكا'])) return '☕';
    if (matches(['peanut', 'الفول السوداني', 'فول سوداني'])) return '🥜';
    if (matches(['coconut', 'جوز الهند'])) return '🥥';
    if (matches(['mango', 'مانجو'])) return '🥭';
    if (matches(['orange', 'برتقال'])) return '🍊';
    if (matches(['lemon', 'ليمون'])) return '🍋';
    if (matches(['mint', 'نعناع'])) return '🌿';
    return '🥤';
  }

  edit(v: ProductVariant): void {
    this.editingId.set(v._id);
    this.draft = {
      sku: v.sku, price: v.price, compareAtPrice: v.compareAtPrice, flavor: v.flavor ?? '', sizeLabel: v.sizeLabel ?? '',
      sizeValue: v.sizeValue, sizeUnit: v.sizeUnit, servings: v.servings, scoops: v.scoops,
      stockQuantity: v.stockQuantity ?? v.availableQuantity ?? 0, lowStockThreshold: v.lowStockThreshold ?? 5,
      trackInventory: v.trackInventory ?? true
    };
    this.showForm.set(true);
  }

  cancel(): void { this.editingId.set(null); this.showForm.set(false); }

  save(): void {
    if (!this.draft.sku.trim() || this.draft.price < 0) return;
    this.saving.set(true);
    const payload: any = this.toPayload();
    const request$ = this.editingId()
      ? this.variantsApi.update(this.editingId()!, payload)
      : this.variantsApi.create(this.productId, { ...payload, isDefault: this.variants().length === 0, isActive: true });
    request$.subscribe({
      next: () => { this.saving.set(false); this.editingId.set(null); this.showForm.set(false); this.reload(); this.toast.success(this.lang.pick('تم حفظ الـ Variant', 'Variant saved')); },
      error: () => { this.saving.set(false); this.toast.error(this.lang.pick('تعذر حفظ الـ Variant', 'Could not save variant')); }
    });
  }

  remove(v: ProductVariant): void {
    if (!confirm(this.lang.pick('هل تريد حذف هذا الخيار؟', 'Deactivate this variant?'))) return;
    this.variantsApi.remove(v._id).subscribe({ next: () => { this.reload(); this.toast.success(this.lang.pick('تم حذف الخيار', 'Variant deactivated')); } });
  }

  private toPayload(): VariantPayload & Record<string, unknown> {
    const p: any = {
      sku: this.draft.sku.trim(), price: Number(this.draft.price), flavor: this.draft.flavor.trim() || undefined,
      sizeLabel: this.draft.sizeLabel.trim() || undefined, sizeValue: this.draft.sizeValue || undefined,
      sizeUnit: this.draft.sizeUnit || undefined, servings: this.draft.servings || undefined, scoops: this.draft.scoops || undefined,
      compareAtPrice: this.draft.compareAtPrice || undefined, stockQuantity: Number(this.draft.stockQuantity) || 0,
      lowStockThreshold: Number(this.draft.lowStockThreshold) || 0, trackInventory: this.draft.trackInventory
    };
    return p;
  }

  private emptyDraft(): VariantDraft {
    return { sku: '', price: this.basePrice || 0, flavor: '', sizeLabel: '', sizeValue: undefined, sizeUnit: 'g', servings: undefined, scoops: undefined, stockQuantity: 0, lowStockThreshold: 5, trackInventory: true };
  }
}
