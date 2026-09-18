import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import gsap from 'gsap';

import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { MotionService } from '../../../core/services/motion.service';
import { ToastService } from '../../../core/services/toast.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { EmailVerificationModalComponent } from '../../../components/auth/email-verification-modal/email-verification-modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, EmailVerificationModalComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('card') card?: ElementRef<HTMLElement>;

  email = '';
  password = '';
  submitting = signal(false);
  formError = signal<string | null>(null);

  // The backend rejects login with 403 + this message until the account's
  // email is verified (see auth.controller.js `login`). Registration shows
  // the verification modal automatically, but a user who closes it (or
  // comes back later without ever verifying) previously had NO way to
  // verify from the login page and was permanently stuck. This re-opens
  // the same modal here so they can finish verifying and log in.
  showVerificationModal = signal(false);

  constructor(
    private auth: AuthService,
    private cart: CartService,
    private wishlist: WishlistService,
    private motion: MotionService,
    private toast: ToastService,
    public lang: LanguageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    const el = this.card?.nativeElement;
    if (el && this.motion.canAnimate()) {
      gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
  }

  submit(form: NgForm): void {
    this.formError.set(null);
    if (form.invalid) return;

    this.submitting.set(true);
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.cart.refresh().subscribe();
        this.wishlist.refresh().subscribe();
        this.toast.success(this.lang.pick('تم تسجيل الدخول بنجاح', 'Logged in successfully'));
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/';
        this.router.navigateByUrl(redirectTo);
      },
      error: (err) => {
        this.submitting.set(false);

        const message: string | undefined = err?.error?.message;

        if (err?.status === 403 && message?.toLowerCase().includes('verify')) {
          this.showVerificationModal.set(true);
          this.formError.set(message);
          return;
        }

        this.formError.set(message || this.lang.pick('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'Invalid email or password'));
      }
    });
  }

  onVerified(): void {
    this.showVerificationModal.set(false);
    this.toast.success(this.lang.pick('تم تأكيد بريدك الإلكتروني، يمكنك تسجيل الدخول الآن', 'Your email is verified — you can log in now'));
  }

  onVerificationClosed(): void {
    this.showVerificationModal.set(false);
  }
}
