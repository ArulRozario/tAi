import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '../auth/auth.service';

interface Session {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    TagModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  user = signal<any>(null);
  profileLoadError = signal(false);
  isEditing = signal(false);
  isChangingPassword = signal(false);

  editForm = signal({ name: '', email: '' });
  passwordForm = signal({ currentPassword: '', newPassword: '', confirmPassword: '' });

  sessions = signal<Session[]>([]);
  sessionsTotal = signal(0);
  sessionsLoading = signal(false);

  loading = signal(false);

  ngOnInit() {
    this.loadProfile();
    this.loadSessions();
  }

  loadProfile() {
    this.profileLoadError.set(false);
    this.authService.fetchMe().subscribe({
      next: (user) => {
        this.user.set(user);
        this.editForm.set({ name: user.name, email: user.email });
      },
      error: () => {
        this.profileLoadError.set(true);
      },
    });
  }

  loadSessions() {
    this.sessionsLoading.set(true);
    this.authService.getSessions().subscribe({
      next: (res) => {
        this.sessions.set(res.sessions);
        this.sessionsTotal.set(res.total);
        this.sessionsLoading.set(false);
      },
      error: () => {
        this.sessionsLoading.set(false);
      },
    });
  }

  startEditing() {
    const user = this.user();
    if (user) {
      this.editForm.set({ name: user.name, email: user.email });
      this.isEditing.set(true);
    }
  }

  cancelEditing() {
    this.isEditing.set(false);
  }

  saveProfile() {
    this.loading.set(true);
    const data = this.editForm();

    this.authService.updateProfile({ name: data.name, email: data.email }).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.isEditing.set(false);
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Profile updated',
          detail: 'Your profile has been saved.',
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Update failed',
          detail: err.error?.message || 'Could not update profile.',
        });
      },
    });
  }

  startChangingPassword() {
    this.passwordForm.set({ currentPassword: '', newPassword: '', confirmPassword: '' });
    this.isChangingPassword.set(true);
  }

  cancelChangingPassword() {
    this.isChangingPassword.set(false);
  }

  changePassword() {
    const form = this.passwordForm();

    if (form.newPassword !== form.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation error',
        detail: 'New passwords do not match.',
      });
      return;
    }

    if (form.newPassword.length < 8) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation error',
        detail: 'Password must be at least 8 characters.',
      });
      return;
    }

    this.loading.set(true);

    this.authService.changePassword(form.currentPassword, form.newPassword).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Password changed',
          detail: 'Your password has been updated. Please sign in again.',
        });
        setTimeout(() => this.authService.logout(), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Password change failed',
          detail: err.error?.message || 'Could not change password.',
        });
      },
    });
  }

  revokeSession(session: Session) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to end this session?',
      header: 'End Session',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.authService.revokeSession(session.id).subscribe({
          next: () => {
            this.loadSessions();
            this.messageService.add({
              severity: 'success',
              summary: 'Session ended',
              detail: 'The session has been revoked.',
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: 'Could not revoke session.',
            });
          },
        });
      },
    });
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (role) {
      case 'ADMIN': return 'danger';
      case 'MASTER': return 'warn';
      case 'REVIEWER': return 'info';
      default: return 'secondary';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  }
}