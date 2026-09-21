import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  signal,
} from "@angular/core";

import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";

import { ActivatedRoute, Router, RouterLink } from "@angular/router";

import gsap from "gsap";

import { AuthService } from "../../../core/services/auth.service";
import { MotionService } from "../../../core/services/motion.service";
import { LanguageService } from "../../../core/services/language.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";

@Component({
  selector: "app-reset-password",
  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],

  templateUrl: "./reset-password.component.html",

  styleUrl: "./reset-password.component.scss",
})
export class ResetPasswordComponent implements AfterViewInit {
  @ViewChild("card")
  card?: ElementRef<HTMLElement>;

  resetToken = "";

  newPassword = "";

  confirmPassword = "";

  showPassword = false;

  showConfirmPassword = false;

  submitting = signal(false);

  completed = signal(false);

  formError = signal<string | null>(null);

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private motion: MotionService,
    public lang: LanguageService,
  ) {
    this.resetToken =
      this.route.snapshot.queryParamMap.get("resetToken")?.trim() || "";

    if (!this.resetToken) {
      this.formError.set(
        this.lang.pick(
          "جلسة إعادة تعيين كلمة المرور غير صالحة أو انتهت صلاحيتها.",
          "This password reset session is invalid or has expired.",
        ),
      );
    }
  }

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

  // ================================
  // Password validation
  // ================================

  hasMinLength(): boolean {
    return this.newPassword.length >= 8;
  }

  hasLetter(): boolean {
    return /[A-Za-z\u0600-\u06FF]/.test(this.newPassword);
  }

  hasNumber(): boolean {
    return /\d/.test(this.newPassword);
  }

  hasSpecialChar(): boolean {
    return /[@#!$%^&*]/.test(this.newPassword);
  }

  isPasswordValid(): boolean {
    return (
      this.hasMinLength() &&
      this.hasLetter() &&
      this.hasNumber() &&
      this.hasSpecialChar()
    );
  }

  passwordsMatch(): boolean {
    return (
      this.newPassword.length > 0 && this.newPassword === this.confirmPassword
    );
  }

  // ================================
  // Submit
  // ================================

  submit(form: NgForm): void {
    this.formError.set(null);

    if (!this.resetToken) {
      this.formError.set(
        this.lang.pick(
          "جلسة إعادة تعيين كلمة المرور غير صالحة أو انتهت صلاحيتها.",
          "This password reset session is invalid or has expired.",
        ),
      );

      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.isPasswordValid()) {
      this.formError.set(
        this.lang.pick(
          "كلمة المرور لا تستوفي جميع الشروط المطلوبة.",
          "The password does not meet all the required rules.",
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

    this.auth.resetPassword(this.resetToken, this.newPassword).subscribe({
      next: () => {
        this.submitting.set(false);
        this.completed.set(true);
      },

      error: (err) => {
        this.submitting.set(false);

        this.formError.set(
          err?.error?.message ||
            this.lang.pick(
              "تعذر تغيير كلمة المرور. ربما انتهت صلاحية جلسة إعادة التعيين.",
              "Could not reset your password. Your reset session may have expired.",
            ),
        );
      },
    });
  }

  // ================================
  // Navigation
  // ================================

  goToLogin(): void {
    this.router.navigateByUrl("/login");
  }
}
