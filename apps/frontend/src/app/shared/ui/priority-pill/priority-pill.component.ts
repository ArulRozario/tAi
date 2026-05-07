import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-priority-pill',
  standalone: true,
  imports: [CommonModule, TagModule],
  template: `
    <p-tag [severity]="severity" [value]="displayLabel" [rounded]="true"></p-tag>
  `
})
export class PriorityPillComponent {
  @Input() level: string = 'Low';

  get displayLabel(): string {
    const n = this.level?.toLowerCase();
    return n ? n.charAt(0).toUpperCase() + n.slice(1) : this.level;
  }

  get severity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (this.level?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warn';
      case 'LOW': return 'info';
      default: return 'info';
    }
  }
}
