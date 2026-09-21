import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
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
  selector: "app-verify-reset-otp",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: "./verify-reset-otp.component.html",
  styleUrl: "./verify-reset-otp.component.scss",
})
export class VerifyResetOtpComponent implements AfterViewInit, OnDestroy {
  @ViewChild("card")
  card?: ElementRef<HTMLElement>;

  email = "";
  code = "";

  submitting = signal(false);
  resending = signal(false);
  formError = signal<string | null>(null);

  resendSeconds = signal(60);
  canResend = signal(false);

  private resendTimer?: ReturnType<typeof setInterval>;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private motion: MotionService,
    public lang: LanguageService,
  ) {
    this.email =
      this.route.snapshot.queryParamMap.get("email")?.trim().toLowerCase() ||
      "";

    if (!this.email) {
      this.formError.set(
        this.lang.pick(
          "البريد الإلكتروني غير موجود. ابدأ عملية إعادة تعيين كلمة المرور من جديد.",
          "No email address was provided. Please start the password reset process again.",
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

    this.startResendCountdown();
  }

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  /**
   * Keep the OTP field numeric and limited to 6 digits.
   */
  onCodeInput(value: string): void {
    this.code = value.replace(/\D/g, "").slice(0, 6);
  }

  submit(form: NgForm): void {
    this.formError.set(null);

    if (!this.email) {
      this.formError.set(
        this.lang.pick(
          "البريد الإلكتروني غير موجود.",
          "Email address is missing.",
        ),
      );
      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const normalizedCode = this.code.replace(/\D/g, "").slice(0, 6);

    if (normalizedCode.length !== 6) {
      this.formError.set(
        this.lang.pick(
          "رمز التحقق يجب أن يتكون من 6 أرقام.",
          "The verification code must contain 6 digits.",
        ),
      );
      return;
    }

    this.submitting.set(true);

    this.auth.verifyResetOtp(this.email, normalizedCode).subscribe({
      next: (res) => {
        this.submitting.set(false);

        const resetToken = res.data?.resetToken;

        if (!resetToken) {
          this.formError.set(
            this.lang.pick(
              "تعذر بدء عملية إعادة تعيين كلمة المرور.",
              "Could not start the password reset process.",
            ),
          );
          return;
        }

        this.router.navigate(["/reset-password"], {
          queryParams: {
            resetToken,
          },
        });
      },

      error: (err) => {
        this.submitting.set(false);

        this.formError.set(
          err?.error?.message ||
            this.lang.pick(
              "رمز التحقق غير صحيح أو انتهت صلاحيته.",
              "The verification code is invalid or has expired.",
            ),
        );
      },
    });
  }

  resend(): void {
    if (!this.email || !this.canResend() || this.resending()) {
      return;
    }

    this.formError.set(null);
    this.resending.set(true);

    this.auth.resendResetOtp(this.email).subscribe({
      next: () => {
        this.resending.set(false);
        this.code = "";
        this.startResendCountdown();
      },

      error: (err) => {
        this.resending.set(false);

        this.formError.set(
          err?.error?.message ||
            this.lang.pick(
              "تعذر إرسال رمز جديد.",
              "Could not send a new verification code.",
            ),
        );
      },
    });
  }

  private startResendCountdown(): void {
    this.clearResendTimer();

    this.resendSeconds.set(60);
    this.canResend.set(false);

    this.resendTimer = setInterval(() => {
      const current = this.resendSeconds();

      if (current <= 1) {
        this.clearResendTimer();

        this.resendSeconds.set(0);
        this.canResend.set(true);

        return;
      }

      this.resendSeconds.set(current - 1);
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = undefined;
    }
  }
}
