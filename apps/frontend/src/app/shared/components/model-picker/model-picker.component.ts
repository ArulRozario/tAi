import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SelectModule } from 'primeng/select';
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
  imports: [CommonModule, FormsModule, SelectModule],
  template: `
    <p-select
      [options]="selectOptions()"
      [ngModel]="selectedModel()"
      (ngModelChange)="onSelect($event)"
      optionLabel="label"
      optionValue="value"
      [disabled]="disabled"
      placeholder="Default (auto)"
      styleClass="model-picker-select"
      size="small"
    />
  `,
  styles: [`
    :host { display: inline-block; }
    :host ::ng-deep .model-picker-select {
      min-width: 160px;
    }
  `]
})
export class ModelPickerComponent implements OnInit, OnDestroy {
  @Input() label = '';
  @Input() disabled = false;
  @Input() showDefault = true;
  @Input() showStatus = false;
  @Input() initialModel = '';
  @Output() modelChange = new EventEmitter<string>();

  allModels = signal<ModelOption[]>([]);
  healthyModels = signal<ModelOption[]>([]);
  selectedModel = signal<string>('');
  loadError = signal<string>('');

  selectOptions = () => {
    const opts = this.healthyModels().map(m => ({ label: m.label, value: m.name }));
    return this.showDefault ? [{ label: 'Default (auto)', value: '' }, ...opts] : opts;
  };

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
