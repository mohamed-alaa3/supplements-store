import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

import { Order, OrderStatus } from "../../../core/models";
import { OrderService } from "../../../core/services/order.service";
import { LanguageService } from "../../../core/services/language.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoadingSkeletonComponent } from "../../../shared/components/loading-skeleton/loading-skeleton.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

type OrderSort = "newest" | "oldest" | "total_asc" | "total_desc";

interface OrdersMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface AdminOrdersResponse {
  data: Order[];
  meta?: OrdersMeta;
}

@Component({
  selector: "app-admin-orders",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./admin-orders.component.html",
  styleUrl: "./admin-orders.component.scss",
})
export class AdminOrdersComponent implements OnInit {
  orders = signal<Order[]>([]);

  loading = signal(true);
  error = signal(false);

  search = "";
  status = "all";
  sort: OrderSort = "newest";

  page = 1;
  limit = 10;

  totalItems = 0;
  totalPages = 1;

  readonly orderStatuses = ORDER_STATUSES;

  constructor(
    private orderService: OrderService,
    public lang: LanguageService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.orderService
      .adminList({
        status:
          this.status === "all" ? undefined : (this.status as OrderStatus),
        search: this.search.trim() || undefined,
        sort: this.sort,
        page: this.page,
        limit: this.limit,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          const response = res as AdminOrdersResponse;

          this.orders.set(response.data ?? []);

          this.totalItems = response.meta?.totalItems ?? 0;
          this.totalPages = Math.max(response.meta?.totalPages ?? 1, 1);
        },

        error: () => {
          this.error.set(true);
          this.orders.set([]);

          this.toast.error(
            this.lang.pick("تعذر تحميل الطلبات", "Failed to load orders"),
          );
        },
      });
  }

  onSearch(): void {
    this.page = 1;
    this.load();
  }

  onFilterChange(): void {
    this.page = 1;
    this.load();
  }

  clearFilters(): void {
    this.search = "";
    this.status = "all";
    this.sort = "newest";
    this.page = 1;

    this.load();
  }

  goToPage(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.page ||
      this.loading()
    ) {
      return;
    }

    this.page = page;
    this.load();
  }

  previousPage(): void {
    this.goToPage(this.page - 1);
  }

  nextPage(): void {
    this.goToPage(this.page + 1);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];

    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, this.page + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  updateStatus(order: Order, status: OrderStatus): void {
    if (status === order.orderStatus) {
      return;
    }

    this.orderService.adminUpdateStatus(order._id, status).subscribe({
      next: (res) => {
        this.orders.update((list) =>
          list.map((item) => (item._id === order._id ? res.data : item)),
        );

        this.toast.success(
          this.lang.pick(
            "تم تحديث حالة الطلب بنجاح",
            "Order status updated successfully",
          ),
        );
      },

      error: () => {
        this.toast.error(
          this.lang.pick(
            "تعذر تحديث حالة الطلب",
            "Failed to update order status",
          ),
        );

        this.load();
      },
    });
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, [string, string]> = {
      pending: ["قيد الانتظار", "Pending"],
      confirmed: ["تم التأكيد", "Confirmed"],
      processing: ["قيد التجهيز", "Processing"],
      shipped: ["تم الشحن", "Shipped"],
      delivered: ["تم التوصيل", "Delivered"],
      cancelled: ["ملغي", "Cancelled"],
      returned: ["مرتجع", "Returned"],
    };

    return this.lang.pick(labels[status][0], labels[status][1]);
  }

  getPaymentStatusLabel(status: Order["paymentStatus"]): string {
    const labels: Record<string, [string, string]> = {
      pending: ["قيد الانتظار", "Pending"],
      paid: ["مدفوع", "Paid"],
      failed: ["فشل", "Failed"],
      refunded: ["تم الاسترداد", "Refunded"],
    };

    const label = labels[status];

    return label ? this.lang.pick(label[0], label[1]) : status;
  }

  getCustomerName(order: Order): string {
    const firstName = order.shippingAddress?.firstName ?? "";
    const lastName = order.shippingAddress?.lastName ?? "";

    return (
      `${firstName} ${lastName}`.trim() || this.lang.pick("عميل", "Customer")
    );
  }

  getCustomerLocation(order: Order): string {
    const city = order.shippingAddress?.city ?? "";
    const area = order.shippingAddress?.area ?? "";

    return [city, area].filter(Boolean).join("، ");
  }

  getItemCount(order: Order): number {
    return order.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
  }

  trackById(_: number, order: Order): string {
    return order._id;
  }
}
