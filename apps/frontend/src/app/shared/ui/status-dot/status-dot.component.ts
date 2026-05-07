import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-dot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="w-2.5 h-2.5 rounded-full inline-block shadow-sm" [ngClass]="statusClass"></span>
  `
})
export class StatusDotComponent {
  @Input() status: string = 'pending';

  get statusClass(): string {
    switch (this.status?.toUpperCase()) {
      case 'APPROVED':
      case 'GOOD': return 'bg-success shadow-success/20';
      case 'HUMAN_REVIEW':
      case 'REVIEW': return 'bg-warning shadow-warning/20';
      case 'PENDING':
      case 'DRAFT': return 'bg-surface-2 border border-border';
      case 'REJECTED':
      case 'CHANGES': return 'bg-error shadow-error/20';
      case 'PROCESSING':
      case 'TRANSLATING':
      case 'REVIEWING':
      case 'EXTRACTING': return 'bg-primary shadow-primary/20 animate-pulse';
      case 'ERROR': return 'bg-error shadow-error/20';
      default: return 'bg-surface-2';
    }
  }
}
