import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../../core/models';
import { UserService } from '../../../core/services/user.service';
import { SellerService } from '../../../core/services/seller.service';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSkeletonComponent],
  templateUrl: './admin-customers.component.html',
  styleUrl: './admin-customers.component.scss'
})
export class AdminCustomersComponent implements OnInit {
  users = signal<User[]>([]);
  loading = signal(true);
  convertingId = signal<string | null>(null);

  constructor(
    private userService: UserService,
    private sellerService: SellerService,
    public lang: LanguageService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.userService.adminListUsers({ limit: 100 }).subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error(this.lang.pick('تعذر تحميل العملاء', 'Failed to load customers'));
      }
    });
  }

  toggleActive(u: User): void {
    this.userService.adminSetUserStatus(u._id, !u.isActive).subscribe({
      next: (res) => {
        this.users.update((list) => list.map((x) => (x._id === u._id ? res.data : x)));
      },
      error: () => {
        this.toast.error(this.lang.pick('تعذر تغيير حالة العميل', 'Failed to change customer status'));
      }
    });
  }

  // The generic role dropdown covers demotions/admin toggling only.
  // Promoting a "customer" to "seller" must go through convertToSeller()
  // below, which also creates the SellerProfile the Seller Dashboard needs —
  // see backend/controllers/user.controller.js `adminSetUserRole` for why.
  roleOptions(u: User): UserRole[] {
    return u.role === 'seller' ? ['customer', 'seller', 'admin'] : ['customer', 'admin'];
  }

  setRole(u: User, role: UserRole): void {
    this.userService.adminSetUserRole(u._id, role).subscribe({
      next: (res) => {
        this.users.update((list) => list.map((x) => (x._id === u._id ? res.data : x)));
      },
      error: () => {
        this.toast.error(this.lang.pick('تعذر تغيير دور العميل', 'Failed to change customer role'));
      }
    });
  }

  // Admin-initiated, one-step conversion: no application, no ID/file upload,
  // no approval wait. Effective immediately — the promoted user's role and
  // seller profile both update in this single request.
  convertToSeller(u: User): void {
    this.convertingId.set(u._id);
    this.sellerService.adminConvertToSeller(u._id).subscribe({
      next: (res) => {
        this.convertingId.set(null);
        this.users.update((list) => list.map((x) => (x._id === u._id ? res.data.user : x)));
        this.toast.success(
          this.lang.pick(
            `تم تحويل ${u.fullName} إلى بائع بنجاح`,
            `${u.fullName} was converted to a seller`
          )
        );
      },
      error: () => {
        this.convertingId.set(null);
        this.toast.error(this.lang.pick('تعذر تحويل العميل إلى بائع', 'Failed to convert customer to seller'));
      }
    });
  }
}
