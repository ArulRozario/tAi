import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tai-quality-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quality-gauge" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.viewBox]="'0 0 64 64'">
        <circle class="gauge-bg" cx="32" cy="32" r="28" />
        <circle 
          class="gauge-fg" 
          cx="32" 
          cy="32" 
          r="28" 
          [style.stroke]="color"
          [style.stroke-dasharray]="dashArray"
          [style.stroke-dashoffset]="dashOffset"
        />
      </svg>
      <div class="gauge-content">
        <span class="gauge-value" [style.font-size.px]="size * 0.22">{{ value }}%</span>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .quality-gauge {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    circle {
      fill: none;
      stroke-width: 6;
      
      &.gauge-bg {
        stroke: var(--border-color);
        opacity: 0.5;
      }

      &.gauge-fg {
        stroke-linecap: round;
        transition: stroke-dasharray 0.8s ease-out, stroke 0.5s ease;
      }
    }

    .gauge-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .gauge-value {
      font-weight: 800;
      color: var(--text-main);
      font-family: var(--font-mono);
      letter-spacing: -0.02em;
    }
  `]
})
export class QualityGaugeComponent {
  @Input() value: number = 0;
  @Input() size: number = 64;
  @Input() color: string = 'var(--accent-warning)';

  get dashArray(): string {
    const r = 28;
    const circ = 2 * Math.PI * r;
    const filled = (this.value / 100) * circ;
    return `${filled} ${circ - filled}`;
  }

  get dashOffset(): number {
    return 0; // Handled by rotation in CSS
  }
}
