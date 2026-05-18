import { Component, input, output, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { WorkbenchStateService, WorkbenchPage } from '../../services/workbench-state.service';
import { ModelPickerComponent } from '../../../shared/components/model-picker/model-picker.component';

@Component({
  selector: 'app-workbench-toolbar',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, SelectModule, AvatarModule, MenuModule, TooltipModule,
    ModelPickerComponent,
  ],
  templateUrl: './workbench-toolbar.component.html',
  styleUrl: './workbench-toolbar.component.scss',
})
export class WorkbenchToolbarComponent {
  state = inject(WorkbenchStateService);

  // ── Inputs ──────────────────────────────────────────────────
  pageData        = input.required<WorkbenchPage>();
  isRetranslating = input(false);
  isCompleting    = input(false);
  isMasterOrAdmin = input(false);
  pageStatusOptions = input<MenuItem[]>([]);
  overflowMenuItems = input<MenuItem[]>([]);

  // ── Outputs ─────────────────────────────────────────────────
  prevPage         = output();
  nextPage         = output();
  retranslate      = output();
  modelChange      = output<string>();
  resetEdits       = output();
  statusChange     = output<string>();
  addReviewer      = output();
  reassignReviewers = output();
  toggleChat       = output();
  approve          = output();
  submitForReview  = output();

  @ViewChild('overflowMenu') overflowMenu!: Menu;

  private readonly AVATAR_COLORS = [
    '#6366f1','#ec4899','#f59e0b','#10b981',
    '#3b82f6','#8b5cf6','#ef4444','#14b8a6',
  ];

  getAvatarColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.AVATAR_COLORS[Math.abs(hash) % this.AVATAR_COLORS.length];
  }

  openOverflow(event: Event) {
    this.overflowMenu.toggle(event);
  }
}
