import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-priority-pill',
  standalone: true,
  imports: [CommonModule, TagModule],
  template: `
    <p-tag [severity]="severity" [value]="level" [rounded]="true"></p-tag>
  `
})
export class PriorityPillComponent {
  @Input() level: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';

  get severity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (this.level) {
      case 'Critical': 
      case 'High': return 'danger';
      case 'Medium': return 'warn';
      case 'Low': return 'info';
      default: return 'info';
    }
  }
}
