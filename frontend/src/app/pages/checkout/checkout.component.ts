import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Address, AddressPayload } from '../../core/models';
import { UserService } from '../../core/services/user.service';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type AsyncState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, LoadingSkeletonComponent, EmptyStateComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  state = signal<AsyncState>('loading');
  addresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);
  showNewAddressForm = signal(false);
  placingOrder = signal(false);

  newAddress: AddressPayload = {
    label: 'Home', firstName: '', lastName: '', phone: '',
    country: 'Egypt', city: '', area: '', street: '',
    building: '', floor: '', apartment: '', notes: '', isDefault: false
  };

  constructor(
    private userService: UserService,
    private orderService: OrderService,
    public cart: CartService,
    public auth: AuthService,
    public lang: LanguageService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cart.refresh().subscribe();
    this.userService.listAddresses().subscribe({
      next: (res) => {
        this.addresses.set(res.data);
        const def = res.data.find((a) => a.isDefault) ?? res.data[0];
        if (def) this.selectedAddressId.set(def._id);
        else this.showNewAddressForm.set(true);
        this.state.set('success');
      },
      error: () => this.state.set('error')
    });
  }

  selectAddress(id: string): void {
    this.selectedAddressId.set(id);
    this.showNewAddressForm.set(false);
  }

  saveNewAddress(form: NgForm): void {
    if (form.invalid) return;
    this.userService.createAddress(this.newAddress).subscribe({
      next: (res) => {
        this.addresses.update((list) => [...list, res.data]);
        this.selectedAddressId.set(res.data._id);
        this.showNewAddressForm.set(false);
        this.toast.success(this.lang.pick('تمت إضافة العنوان', 'Address saved'));
      }
    });
  }

  placeOrder(): void {
    const addressId = this.selectedAddressId();
    if (!addressId) {
      this.toast.error(this.lang.pick('يرجى اختيار عنوان الشحن', 'Please select a shipping address'));
      return;
    }
    if ((this.cart.cart()?.items?.length ?? 0) === 0) {
      this.toast.error(this.lang.pick('سلتك فارغة', 'Your cart is empty'));
      return;
    }

    this.placingOrder.set(true);
    this.orderService.create({ addressId, paymentMethod: 'cash_on_delivery' }).subscribe({
      next: (res) => {
        this.placingOrder.set(false);
        this.cart.refresh().subscribe();
        this.toast.success(this.lang.pick('تم إنشاء طلبك بنجاح!', 'Your order has been placed!'));
        this.router.navigate(['/order-confirmation', res.data._id]);
      },
      error: () => this.placingOrder.set(false)
    });
  }
}
