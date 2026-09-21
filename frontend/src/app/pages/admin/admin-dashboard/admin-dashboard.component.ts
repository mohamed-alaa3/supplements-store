import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";

import {
  AdminOverview,
  AdminService,
} from "../../../core/services/admin.service";

import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { LoadingSkeletonComponent } from "../../../shared/components/loading-skeleton/loading-skeleton.component";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, LoadingSkeletonComponent],
  templateUrl: "./admin-dashboard.component.html",
  styleUrl: "./admin-dashboard.component.scss",
})
export class AdminDashboardComponent implements OnInit {
  overview = signal<AdminOverview | null>(null);
  loading = signal(true);
  error = signal(false);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  private loadOverview(): void {
    this.loading.set(true);
    this.error.set(false);

    this.adminService
      .getOverview()
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (res) => {
          this.overview.set(res.data);
        },

        error: () => {
          this.error.set(true);
        },
      });
  }

  retry(): void {
    this.loadOverview();
  }
}
