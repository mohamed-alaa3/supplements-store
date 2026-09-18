import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Category } from '../../../core/models';
import { CategoryService } from '../../../core/services/category.service';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSkeletonComponent],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss'
})
export class AdminCategoriesComponent implements OnInit {
  categories = signal<Category[]>([]);
  loading = signal(true);
  newCategory = { nameAr: '', nameEn: '' };
  showForm = signal(false);

  constructor(private categoryService: CategoryService, public lang: LanguageService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.categoryService.list().subscribe({
      next: (res) => { this.categories.set(res.data); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.toast.error(this.lang.pick('تعذر تحميل الفئات', 'Failed to load categories'));
      }
    });
  }

  create(form: NgForm): void {
    if (form.invalid) return;
    this.categoryService.create(this.newCategory).subscribe({
      next: () => {
        this.newCategory = { nameAr: '', nameEn: '' };
        this.showForm.set(false);
        this.load();
        this.toast.success(this.lang.pick('تمت إضافة الفئة', 'Category added'));
      },
      error: () => {
        this.toast.error(this.lang.pick('تعذر إضافة الفئة', 'Failed to add category'));
      }
    });
  }

  deactivate(c: Category): void {
    this.categoryService.remove(c._id).subscribe({
      next: () => this.load(),
      error: () => {
        this.toast.error(this.lang.pick('تعذر إلغاء تفعيل الفئة', 'Failed to deactivate category'));
      }
    });
  }
}
