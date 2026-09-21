import { CommonModule } from "@angular/common";

import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  signal,
} from "@angular/core";

import { FormsModule, NgForm } from "@angular/forms";

import { Router, RouterLink } from "@angular/router";

import gsap from "gsap";

import { AuthService } from "../../../core/services/auth.service";

import { MotionService } from "../../../core/services/motion.service";

import { ToastService } from "../../../core/services/toast.service";

import { LanguageService } from "../../../core/services/language.service";

import { TranslatePipe } from "../../../core/i18n/translate.pipe";

import { LucideAngularModule, Eye, EyeOff } from "lucide-angular";

import { EmailVerificationModalComponent } from "../../../components/auth/email-verification-modal/email-verification-modal.component";

@Component({
  selector: "app-register",

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    LucideAngularModule,
    EmailVerificationModalComponent,
  ],

  templateUrl: "./register.component.html",

  styleUrl: "./register.component.scss",
})
export class RegisterComponent implements AfterViewInit {
  @ViewChild("card")
  card?: ElementRef<HTMLElement>;

  fullName = "";
  email = "";
  phone = "";

  password = "";
  confirmPassword = "";

  showPassword = false;
  showConfirmPassword = false;

  submitting = signal(false);

  formError = signal<string | null>(null);

  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  private pendingUser: any = null;
  private pendingToken = "";

  showVerificationModal = signal(false);

  registeredEmail = signal("");

  constructor(
    private auth: AuthService,
    private motion: MotionService,
    private toast: ToastService,
    public lang: LanguageService,
    private router: Router,
  ) {}

  ngAfterViewInit(): void {
    const element = this.card?.nativeElement;

    if (element && this.motion.canAnimate()) {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 18,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        },
      );
    }
  }

  // =========================================
  // Password Validation
  // =========================================

  hasMinLength(): boolean {
    return this.password.length >= 8;
  }

  hasNumber(): boolean {
    return /\d/.test(this.password);
  }

  hasSpecialChar(): boolean {
    return /[@#!$%^&*]/.test(this.password);
  }

  hasLetter(): boolean {
    return /[A-Za-z\u0600-\u06FF]/.test(this.password);
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
      this.confirmPassword.length > 0 && this.password === this.confirmPassword
    );
  }

  // =========================================
  // Password Visibility
  // =========================================

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // =========================================
  // Submit
  // =========================================

  submit(form: NgForm): void {
    this.formError.set(null);

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.isPasswordStrong()) {
      this.formError.set(
        this.lang.pick(
          "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، وحرف، ورقم، ورمز خاص.",
          "Password must contain at least 8 characters, a letter, a number, and a special character.",
        ),
      );

      return;
    }

    if (!this.passwordsMatch()) {
      this.formError.set(
        this.lang.pick(
          "كلمتا المرور غير متطابقتين.",
          "Passwords do not match.",
        ),
      );

      return;
    }

    this.submitting.set(true);

    this.auth
      .register({
        fullName: this.fullName.trim(),
        email: this.email.trim().toLowerCase(),
        password: this.password,
        phone: this.phone.trim() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.submitting.set(false);

          if (response.success && response.data) {
            this.pendingUser = response.data.user;

            this.pendingToken = response.data.token;

            if (response.data.requiresVerification) {
              this.registeredEmail.set(this.email.trim().toLowerCase());

              this.showVerificationModal.set(true);
            } else {
              this.auth.setAuth(this.pendingToken, this.pendingUser);

              this.toast.success(
                this.lang.pick(
                  "تم إنشاء حسابك بنجاح!",
                  "Your account has been created!",
                ),
              );

              this.router.navigateByUrl("/");
            }
          }
        },

        error: (err) => {
          this.submitting.set(false);

          this.formError.set(
            err?.error?.message ||
              this.lang.pick(
                "تعذر إنشاء الحساب.",
                "Could not create your account.",
              ),
          );
        },
      });
  }

  // =========================================
  // Email Verification
  // =========================================

  onVerified(): void {
    this.showVerificationModal.set(false);

    if (this.pendingToken && this.pendingUser) {
      this.auth.setAuth(this.pendingToken, this.pendingUser);
    }

    this.toast.success(
      this.lang.pick(
        "تم تأكيد بريدك الإلكتروني بنجاح!",
        "Email verified successfully!",
      ),
    );

    this.router.navigateByUrl("/");
  }

  onVerificationClosed(): void {
    this.showVerificationModal.set(false);
  }
}
