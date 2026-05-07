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
  @Input() status: 'approved' | 'review' | 'pending' | 'changes' | 'processing' | 'error' | 'good' = 'pending';

  get statusClass(): string {
    switch (this.status) {
      case 'approved': 
      case 'good': return 'bg-success shadow-success/20';
      case 'review': return 'bg-warning shadow-warning/20';
      case 'pending': return 'bg-surface-2 border border-border';
      case 'changes': return 'bg-error shadow-error/20';
      case 'processing': return 'bg-primary shadow-primary/20 animate-pulse';
      case 'error': return 'bg-error shadow-error/20';
      default: return 'bg-surface-2';
    }
  }
}
