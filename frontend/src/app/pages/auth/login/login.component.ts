import { CommonModule } from "@angular/common";

import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  signal,
} from "@angular/core";

import { FormsModule, NgForm } from "@angular/forms";

import { ActivatedRoute, Router, RouterLink } from "@angular/router";

import gsap from "gsap";

import { AuthService } from "../../../core/services/auth.service";
import { CartService } from "../../../core/services/cart.service";
import { WishlistService } from "../../../core/services/wishlist.service";
import { MotionService } from "../../../core/services/motion.service";
import { ToastService } from "../../../core/services/toast.service";
import { LanguageService } from "../../../core/services/language.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";

import { EmailVerificationModalComponent } from "../../../components/auth/email-verification-modal/email-verification-modal.component";

@Component({
  selector: "app-login",
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    EmailVerificationModalComponent,
  ],

  templateUrl: "./login.component.html",

  styleUrl: "./login.component.scss",
})
export class LoginComponent implements AfterViewInit {
  @ViewChild("card")
  card?: ElementRef<HTMLElement>;

  email = "";
  password = "";

  showPassword = false;

  submitting = signal(false);

  formError = signal<string | null>(null);

  showVerificationModal = signal(false);

  constructor(
    private auth: AuthService,
    private cart: CartService,
    private wishlist: WishlistService,
    private motion: MotionService,
    private toast: ToastService,
    public lang: LanguageService,
    private route: ActivatedRoute,
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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  submit(form: NgForm): void {
    this.formError.set(null);

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.auth
      .login({
        email: this.email.trim().toLowerCase(),
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);

          this.cart.refresh().subscribe();
          this.wishlist.refresh().subscribe();

          this.toast.success(
            this.lang.pick("تم تسجيل الدخول بنجاح", "Logged in successfully"),
          );

          const redirectTo =
            this.route.snapshot.queryParamMap.get("redirectTo") || "/";

          this.router.navigateByUrl(redirectTo);
        },

        error: (err) => {
          this.submitting.set(false);

          const message: string | undefined = err?.error?.message;

          if (
            err?.status === 403 &&
            message?.toLowerCase().includes("verify")
          ) {
            this.showVerificationModal.set(true);
            this.formError.set(message);
            return;
          }

          this.formError.set(
            message ||
              this.lang.pick(
                "البريد الإلكتروني أو كلمة المرور غير صحيحة",
                "Invalid email or password",
              ),
          );
        },
      });
  }

  onVerified(): void {
    this.showVerificationModal.set(false);

    this.toast.success(
      this.lang.pick(
        "تم تأكيد بريدك الإلكتروني، يمكنك تسجيل الدخول الآن",
        "Your email is verified — you can log in now",
      ),
    );
  }

  onVerificationClosed(): void {
    this.showVerificationModal.set(false);
  }
}
