import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  signal,
} from "@angular/core";

import { CommonModule } from "@angular/common";

import { FormsModule, NgForm } from "@angular/forms";

import { Router, RouterLink } from "@angular/router";

import gsap from "gsap";

import { AuthService } from "../../../core/services/auth.service";
import { MotionService } from "../../../core/services/motion.service";
import { LanguageService } from "../../../core/services/language.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";

@Component({
  selector: "app-forgot-password",
  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],

  templateUrl: "./forgot-password.component.html",
  styleUrl: "./forgot-password.component.scss",
})
export class ForgotPasswordComponent implements AfterViewInit {
  @ViewChild("card")
  card?: ElementRef<HTMLElement>;

  email = "";

  submitting = signal(false);

  formError = signal<string | null>(null);

  constructor(
    private auth: AuthService,
    private router: Router,
    private motion: MotionService,
    public lang: LanguageService,
  ) {}

  ngAfterViewInit(): void {
    const element = this.card?.nativeElement;

    if (!element || !this.motion.canAnimate()) {
      return;
    }

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

  submit(form: NgForm): void {
    this.formError.set(null);

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const normalizedEmail = this.email.trim().toLowerCase();

    this.submitting.set(true);

    this.auth.forgotPassword(normalizedEmail).subscribe({
      next: () => {
        this.submitting.set(false);

        this.router.navigate(["/verify-reset-otp"], {
          queryParams: {
            email: normalizedEmail,
          },
        });
      },

      error: (err) => {
        this.submitting.set(false);

        this.formError.set(
          err?.error?.message ||
            this.lang.pick(
              "حدث خطأ أثناء إرسال رمز التحقق",
              "Something went wrong while sending the verification code",
            ),
        );
      },
    });
  }
}
