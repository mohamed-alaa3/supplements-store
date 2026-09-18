import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { Address, AddressPayload } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

type Tab = 'profile' | 'addresses' | 'password';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LoadingSkeletonComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent implements OnInit {
  activeTab = signal<Tab>('profile');
  addresses = signal<Address[]>([]);
  addressesLoaded = signal(false);
  savingProfile = signal(false);
  savingPassword = signal(false);
  addingAddress = signal(false);

  profileForm = { fullName: '', phone: '', preferredLanguage: 'en' as 'ar' | 'en' };
  passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  newAddress: AddressPayload = {
    label: 'Home', firstName: '', lastName: '', phone: '',
    country: 'Egypt', city: '', area: '', street: '', isDefault: false
  };
  showNewAddressForm = signal(false);

  constructor(
    public auth: AuthService,
    private userService: UserService,
    public lang: LanguageService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.profileForm = { fullName: user.fullName, phone: user.phone || '', preferredLanguage: user.preferredLanguage };
    }
  }

  loadAddresses(): void {
    if (this.addressesLoaded()) return;
    this.userService.listAddresses().subscribe((res) => {
      this.addresses.set(res.data);
      this.addressesLoaded.set(true);
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'addresses') this.loadAddresses();
  }

  saveProfile(form: NgForm): void {
    if (form.invalid) return;
    this.savingProfile.set(true);
    this.auth.updateProfile(this.profileForm).subscribe({
      next: () => { this.savingProfile.set(false); this.toast.success(this.lang.pick('تم تحديث الملف الشخصي', 'Profile updated')); },
      error: () => this.savingProfile.set(false)
    });
  }

  changePassword(form: NgForm): void {
    if (form.invalid) return;
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toast.error(this.lang.pick('كلمتا المرور غير متطابقتين', 'Passwords do not match'));
      return;
    }
    this.savingPassword.set(true);
    this.auth.changePassword({
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.toast.success(this.lang.pick('تم تغيير كلمة المرور', 'Password changed'));
      },
      error: () => this.savingPassword.set(false)
    });
  }

  addAddress(form: NgForm): void {
    if (form.invalid) return;
    this.addingAddress.set(true);
    this.userService.createAddress(this.newAddress).subscribe({
      next: (res) => {
        this.addresses.update((list) => [...list, res.data]);
        this.addingAddress.set(false);
        this.showNewAddressForm.set(false);
        this.toast.success(this.lang.pick('تمت إضافة العنوان', 'Address added'));
      },
      error: () => this.addingAddress.set(false)
    });
  }

  setDefaultAddress(id: string): void {
    this.userService.setDefaultAddress(id).subscribe(() => {
      this.addresses.update((list) => list.map((a) => ({ ...a, isDefault: a._id === id })));
    });
  }

  deleteAddress(id: string): void {
    this.userService.deleteAddress(id).subscribe(() => {
      this.addresses.update((list) => list.filter((a) => a._id !== id));
    });
  }
}
