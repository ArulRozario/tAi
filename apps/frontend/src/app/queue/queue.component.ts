import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { ApiService, QueuePage, Escalation, User } from '../core/services/api.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    TagModule,
    TabsModule,
    ProgressBarModule,
    AvatarModule,
    AvatarGroupModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './queue.component.html',
  styleUrl: './queue.component.scss',
})
export class QueueComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  isMasterOrAdmin = computed(() => this.authService.hasAnyRole(['MASTER', 'ADMIN']));
  activeTab = signal(0);

  // My Queue tab
  myQueuePages = signal<QueuePage[]>([]);
  myQueueLoading = signal(true);

  // Submitted Reviews tab (MASTER only)
  submittedPages = signal<QueuePage[]>([]);
  submittedLoading = signal(true);

  // Escalations tab
  escalations = signal<Escalation[]>([]);
  escalationsLoading = signal(true);
  showResolveDialog = signal(false);
  resolveTargetId = signal('');
  resolveNote = '';

  ngOnInit() {
    this.loadMyQueue();
    if (this.isMasterOrAdmin()) {
      this.loadSubmittedReviews();
    }
    this.loadEscalations();
  }

  loadMyQueue() {
    this.myQueueLoading.set(true);
    this.api.getQueue({ reviewerId: 'me', limit: '50' }).subscribe({
      next: (res) => { this.myQueuePages.set(res.data); this.myQueueLoading.set(false); },
      error: () => this.myQueueLoading.set(false),
    });
  }

  loadSubmittedReviews() {
    this.submittedLoading.set(true);
    this.api.getSubmittedReviews({ limit: 50 }).subscribe({
      next: (res) => { this.submittedPages.set(res.data); this.submittedLoading.set(false); },
      error: () => this.submittedLoading.set(false),
    });
  }

  loadEscalations() {
    this.escalationsLoading.set(true);
    this.api.getEscalations().subscribe({
      next: (res) => { this.escalations.set(res); this.escalationsLoading.set(false); },
      error: () => this.escalationsLoading.set(false),
    });
  }

  openPage(pageId: string) {
    this.router.navigate(['/workbench', pageId]);
  }

  qualitySeverity(q: number | null | undefined): string {
    if (q == null) return 'secondary';
    if (q >= 80) return 'success';
    if (q >= 60) return 'warn';
    return 'danger';
  }

  prioritySeverity(p: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (p) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warn';
      case 'LOW': return 'secondary';
      default: return 'info';
    }
  }

  waitTime(assignedAt: string | undefined): string {
    if (!assignedAt) return '—';
    const ms = Date.now() - new Date(assignedAt).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  openResolveDialog(pageId: string) {
    this.resolveTargetId.set(pageId);
    this.resolveNote = '';
    this.showResolveDialog.set(true);
  }

  submitResolve() {
    const pageId = this.resolveTargetId();
    if (!pageId) return;
    this.api.resolveEscalation(pageId, this.resolveNote).subscribe({
      next: () => {
        this.showResolveDialog.set(false);
        this.messageService.add({ severity: 'success', summary: 'Resolved', detail: 'Escalation resolved.', life: 2000 });
        this.loadEscalations();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to resolve escalation.' }),
    });
  }
}
