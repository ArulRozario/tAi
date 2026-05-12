import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ProjectService } from '../../../projects/projects.service';

export interface ModelOption {
  name: string;
  label: string;
  status: string;
  retryAt?: string;
}

@Component({
  selector: 'tai-model-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="model-picker">
      <label class="picker-label" *ngIf="label">{{ label }}</label>
      <select
        class="picker-select"
        [ngModel]="selectedModel()"
        (ngModelChange)="onSelect($event)"
        [disabled]="disabled || healthyModels().length === 0"
      >
        <option value="" *ngIf="showDefault">Default (auto)</option>
        <option
          *ngFor="let m of healthyModels()"
          [value]="m.name"
          [title]="m.name"
        >
          {{ m.label }}
        </option>
      </select>

      <div class="model-statuses" *ngIf="showStatus && allModels().length > 0">
        <div
          *ngFor="let m of allModels()"
          class="status-badge"
          [class.healthy]="m.status === 'healthy'"
          [class.exhausted]="m.status === 'exhausted'"
          [title]="m.status === 'exhausted' ? 'Retry at ' + (m.retryAt | date:'short') : 'Healthy'"
        >
          <span class="dot"></span>
          <span class="name">{{ m.label }}</span>
        </div>
      </div>

      <div class="picker-hint" *ngIf="disabled">Loading models…</div>
      <div class="picker-hint error" *ngIf="loadError()">{{ loadError() }}</div>
    </div>
  `,
  styles: [`
    .model-picker {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .picker-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .picker-select {
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background: var(--surface-1);
      color: var(--text-main);
      font-size: 0.85rem;
      cursor: pointer;
      min-width: 180px;
    }
    .picker-select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .model-statuses {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 2px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      background: var(--surface-2);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }
    .status-badge.healthy .dot {
      background: var(--accent-success);
    }
    .status-badge.exhausted .dot {
      background: var(--accent-danger);
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }
    .picker-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .picker-hint.error {
      color: var(--accent-danger);
    }
  `]
})
export class ModelPickerComponent implements OnInit, OnDestroy {
  @Input() label = 'AI Model';
  @Input() disabled = false;
  @Input() showDefault = true;
  @Input() showStatus = true;
  @Input() initialModel = '';
  @Output() modelChange = new EventEmitter<string>();

  allModels = signal<ModelOption[]>([]);
  healthyModels = signal<ModelOption[]>([]);
  selectedModel = signal<string>('');
  loadError = signal<string>('');

  private destroy$ = new Subject<void>();

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.selectedModel.set(this.initialModel);
    this.loadModels();
    this.connectStream();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSelect(value: string) {
    this.selectedModel.set(value);
    this.modelChange.emit(value);
  }

  private loadModels() {
    this.projectService.getModels()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (models) => {
          this.allModels.set(models);
          this.healthyModels.set(models.filter((m) => m.status === 'healthy'));
        },
        error: (err: any) => {
          this.loadError.set('Failed to load models');
          faro.api?.pushError(new Error(`Model load error: ${String(err)}`));
        },
      });
  }

  private connectStream() {
    this.projectService.modelStatusStream()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'refresh' && Array.isArray(data.models)) {
              this.allModels.set(data.models);
              this.healthyModels.set(data.models.filter((m: ModelOption) => m.status === 'healthy'));
            } else if (data.type === 'exhausted' || data.type === 'healthy') {
              // Refresh full list on individual status changes
              this.loadModels();
            }
          } catch {
            // ignore malformed SSE events
          }
        },
        error: () => {
          // SSE errors are non-fatal; models will refresh on next interval
        },
      });
  }
}
