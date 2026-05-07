import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnobModule } from 'primeng/knob';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quality-ring',
  standalone: true,
  imports: [CommonModule, KnobModule, FormsModule],
  template: `
    <p-knob 
      [(ngModel)]="value" 
      [readonly]="true" 
      [size]="size" 
      [valueColor]="color" 
      rangeColor="var(--surface-2)" 
      [strokeWidth]="8">
    </p-knob>
  `
})
export class QualityRingComponent {
  @Input() value: number = 0;
  @Input() size: number = 64;

  get color(): string {
    if (this.value >= 80) return 'var(--success)';
    if (this.value >= 60) return 'var(--warning)';
    return 'var(--error)';
  }
}
