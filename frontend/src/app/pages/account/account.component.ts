import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";

import { Address, AddressPayload } from "../../core/models";
import { AuthService } from "../../core/services/auth.service";
import { UserService } from "../../core/services/user.service";
import { LanguageService } from "../../core/services/language.service";
import { ToastService } from "../../core/services/toast.service";

import { TranslatePipe } from "../../core/i18n/translate.pipe";
import { LoadingSkeletonComponent } from "../../shared/components/loading-skeleton/loading-skeleton.component";

import { LucideAngularModule, Eye, EyeOff } from "lucide-angular";

type Tab = "profile" | "addresses" | "password";

@Component({
  selector: "app-account",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    LoadingSkeletonComponent,
    LucideAngularModule,
  ],
  templateUrl: "./account.component.html",
  styleUrl: "./account.component.scss",
})
export class AccountComponent implements OnInit {
  activeTab = signal<Tab>("profile");

  addresses = signal<Address[]>([]);
  addressesLoaded = signal(false);

  savingProfile = signal(false);
  savingPassword = signal(false);
  addingAddress = signal(false);

  profileForm = {
    fullName: "",
    phone: "",
    preferredLanguage: "en" as "ar" | "en",
  };

  passwordForm = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  newAddress: AddressPayload = {
    label: "Home",
    firstName: "",
    lastName: "",
    phone: "",
    country: "Egypt",
    city: "",
    area: "",
    street: "",
    isDefault: false,
  };

  showNewAddressForm = signal(false);

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  constructor(
    public auth: AuthService,
    private userService: UserService,
    public lang: LanguageService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();

    if (user) {
      this.profileForm = {
        fullName: user.fullName,
        phone: user.phone || "",
        preferredLanguage: user.preferredLanguage,
      };
    }
  }

  loadAddresses(): void {
    if (this.addressesLoaded()) return;

    this.userService.listAddresses().subscribe({
      next: (res) => {
        this.addresses.set(res.data);
        this.addressesLoaded.set(true);
      },
      error: () => {
        this.addressesLoaded.set(true);
      },
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);

    if (tab === "addresses") {
      this.loadAddresses();
    }
  }

  // =========================
  // Password validation
  // =========================

  hasMinLength(): boolean {
    return this.passwordForm.newPassword.length >= 8;
  }

  hasLetter(): boolean {
    return /[A-Za-z\u0600-\u06FF]/.test(this.passwordForm.newPassword);
  }

  hasNumber(): boolean {
    return /\d/.test(this.passwordForm.newPassword);
  }

  hasSpecialChar(): boolean {
    return /[@#!$%^&*]/.test(this.passwordForm.newPassword);
  }

  isPasswordStrong(): boolean {
    return (
      this.hasMinLength() &&
      this.hasLetter() &&
      this.hasNumber() &&
      this.hasSpecialChar()
    );
  }

  passwordsMatch(): boolean {
    return (
      this.passwordForm.confirmPassword.length > 0 &&
      this.passwordForm.newPassword === this.passwordForm.confirmPassword
    );
  }

  isPasswordFormValid(): boolean {
    return (
      this.passwordForm.currentPassword.length > 0 &&
      this.isPasswordStrong() &&
      this.passwordsMatch()
    );
  }

  toggleCurrentPassword(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // =========================
  // Profile
  // =========================

  saveProfile(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);

    this.auth.updateProfile(this.profileForm).subscribe({
      next: () => {
        this.savingProfile.set(false);

        this.toast.success(
          this.lang.pick("تم تحديث الملف الشخصي", "Profile updated"),
        );
      },
      error: () => {
        this.savingProfile.set(false);
      },
    });
  }

  // =========================
  // Password
  // =========================

  changePassword(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.isPasswordStrong()) {
      this.toast.error(
        this.lang.pick(
          "كلمة المرور الجديدة لا تستوفي جميع الشروط",
          "The new password does not meet all requirements",
        ),
      );
      return;
    }

    if (!this.passwordsMatch()) {
      this.toast.error(
        this.lang.pick("كلمتا المرور غير متطابقتين", "Passwords do not match"),
      );
      return;
    }

    this.savingPassword.set(true);

    this.auth
      .changePassword({
        currentPassword: this.passwordForm.currentPassword,
        newPassword: this.passwordForm.newPassword,
      })
      .subscribe({
        next: () => {
          this.savingPassword.set(false);

          this.passwordForm = {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          };

          this.showCurrentPassword = false;
          this.showNewPassword = false;
          this.showConfirmPassword = false;

          this.toast.success(
            this.lang.pick("تم تغيير كلمة المرور", "Password changed"),
          );
        },

        error: (err) => {
          this.savingPassword.set(false);

          this.toast.error(
            err?.error?.message ||
              this.lang.pick(
                "تعذر تغيير كلمة المرور",
                "Could not change password",
              ),
          );
        },
      });
  }

  // =========================
  // Addresses
  // =========================

  addAddress(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.addingAddress.set(true);

    this.userService.createAddress(this.newAddress).subscribe({
      next: (res) => {
        this.addresses.update((list) => [...list, res.data]);

        this.addingAddress.set(false);
        this.showNewAddressForm.set(false);

        this.newAddress = {
          label: "Home",
          firstName: "",
          lastName: "",
          phone: "",
          country: "Egypt",
          city: "",
          area: "",
          street: "",
          isDefault: false,
        };

        this.toast.success(
          this.lang.pick("تمت إضافة العنوان", "Address added"),
        );
      },

      error: () => {
        this.addingAddress.set(false);
      },
    });
  }

  setDefaultAddress(id: string): void {
    this.userService.setDefaultAddress(id).subscribe(() => {
      this.addresses.update((list) =>
        list.map((address) => ({
          ...address,
          isDefault: address._id === id,
        })),
      );
    });
  }

  deleteAddress(id: string): void {
    this.userService.deleteAddress(id).subscribe(() => {
      this.addresses.update((list) =>
        list.filter((address) => address._id !== id),
      );
    });
  }
}
