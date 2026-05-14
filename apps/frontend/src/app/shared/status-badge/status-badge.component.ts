import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  @Input() status: 'active' | 'complete' | 'new' | string = 'new';

  getStatusLabel(): string {
    if (!this.status) return '';
    return this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }
}
