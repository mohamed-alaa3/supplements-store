import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../../core/models';
import { UserService } from '../../../core/services/user.service';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

const ROLES: UserRole[] = ['customer', 'seller', 'admin'];

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
  readonly roles = ROLES;

  constructor(
    private userService: UserService,
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
}
