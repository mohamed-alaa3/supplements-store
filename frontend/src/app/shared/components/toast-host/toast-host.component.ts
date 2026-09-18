import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.scss'
})
export class ToastHostComponent {
  constructor(public toastService: ToastService) {}
}
