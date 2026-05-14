import { Component, signal, inject, OnInit, computed, ViewChild } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule, Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import {
  AdminUsersService,
  User,
  UserDetail,
  ListUsersParams,
} from './services/admin-users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    DialogModule,
    TooltipModule,
    MenuModule,
    AvatarModule,
    DrawerModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  @ViewChild('menu') menu!: Menu;

  private adminService = inject(AdminUsersService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  users = signal<User[]>([]);
  selectedUser = signal<UserDetail | null>(null);
  isPanelOpen = signal(false);
  isInviteDialogOpen = signal(false);

  loading = signal(false);
  loadingMore = signal(false);
  loadingUserDetail = signal(false);

  pagination = signal({ page: 1, limit: 20, total: 0, totalPages: 0 });

  filters = signal({
    search: '',
    role: null as string | null,
    isActive: null as boolean | null,
    sortBy: 'createdAt' as 'name' | 'email' | 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  hasMore = computed(() => {
    const { page, totalPages } = this.pagination();
    return page < totalPages;
  });

  memberSummary = computed(() => {
    const all = this.users();
    const masters = all.filter((u) => u.role === 'MASTER').length;
    const reviewers = all.filter((u) => u.role === 'REVIEWER').length;
    const total = this.pagination().total || all.length;
    return `${total} members · ${masters} master${masters !== 1 ? 's' : ''} · ${reviewers} reviewer${reviewers !== 1 ? 's' : ''}`;
  });

  roleOptions = [
    { label: 'All Roles', value: '' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Master', value: 'MASTER' },
    { label: 'Reviewer', value: 'REVIEWER' },
  ];

  statusOptions = [
    { label: 'All Status', value: null as any },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  inviteForm = signal({ name: '', email: '', role: 'REVIEWER' });

  menuItems = signal<MenuItem[]>([]);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    const params: ListUsersParams = {
      page: 1,
      limit: this.pagination().limit,
      ...this.filters(),
    };

    this.adminService.listUsers(params).subscribe({
      next: (res) => {
        this.users.set(res.users);
        this.pagination.set({ page: 1, limit: res.limit, total: res.total, totalPages: res.totalPages });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load members.' });
      },
    });
  }

  loadMore() {
    this.loadingMore.set(true);
    const nextPage = this.pagination().page + 1;
    const params: ListUsersParams = { page: nextPage, limit: this.pagination().limit, ...this.filters() };

    this.adminService.listUsers(params).subscribe({
      next: (res) => {
        this.users.update((current) => [...current, ...res.users]);
        this.pagination.update((p) => ({ ...p, page: nextPage, total: res.total, totalPages: res.totalPages }));
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  onSearch(event: Event) {
    const search = (event.target as HTMLInputElement).value;
    this.filters.update((f) => ({ ...f, search }));
    this.loadUsers();
  }

  onRoleFilter(event: { value: string }) {
    this.filters.update((f) => ({ ...f, role: event.value || null }));
    this.loadUsers();
  }

  onStatusFilter(event: { value: boolean | null }) {
    this.filters.update((f) => ({ ...f, isActive: event.value }));
    this.loadUsers();
  }

  viewUser(user: User) {
    this.loadingUserDetail.set(true);
    this.isPanelOpen.set(true);

    this.adminService.getUser(user.id).subscribe({
      next: (detail) => {
        this.selectedUser.set(detail);
        this.loadingUserDetail.set(false);
      },
      error: () => {
        this.loadingUserDetail.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load member details.' });
      },
    });
  }

  closePanel() {
    this.isPanelOpen.set(false);
    this.selectedUser.set(null);
  }

  openInviteDialog() {
    this.inviteForm.set({ name: '', email: '', role: 'REVIEWER' });
    this.isInviteDialogOpen.set(true);
  }

  closeInviteDialog() {
    this.isInviteDialogOpen.set(false);
  }

  setInviteRole(role: string) {
    this.inviteForm.update((f) => ({ ...f, role }));
  }

  createUser() {
    const form = this.inviteForm();
    if (!form.name || !form.email || !form.role) {
      this.messageService.add({ severity: 'error', summary: 'Validation error', detail: 'All fields are required.' });
      return;
    }

    this.adminService.createUser(form).subscribe({
      next: () => {
        this.isInviteDialogOpen.set(false);
        this.loadUsers();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: err.error?.message || 'Could not add member.',
        });
      },
    });
  }

  showActions(event: Event, user: User) {
    const items: MenuItem[] = [
      { label: 'View Details', icon: 'pi pi-eye', command: () => this.viewUser(user) },
      { label: 'Reset Password', icon: 'pi pi-key', command: () => this.resetPassword(user) },
    ];

    if (user.isActive) {
      items.push({ label: 'Deactivate', icon: 'pi pi-ban', command: () => this.deactivate(user) });
    } else {
      items.push({ label: 'Reactivate', icon: 'pi pi-check', command: () => this.reactivate(user) });
    }

    this.menuItems.set(items);
    this.menu.toggle(event);
  }

  resetPassword(user: User) {
    this.confirmationService.confirm({
      message: `Reset password for ${user.name}? A temporary password will be generated.`,
      header: 'Reset Password',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.adminService.resetPassword(user.id).subscribe({
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Could not reset password.' });
          },
        });
      },
    });
  }

  deactivate(user: User) {
    this.confirmationService.confirm({
      message: `Deactivate ${user.name}? They will be logged out immediately.`,
      header: 'Deactivate Member',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.adminService.deactivateUser(user.id).subscribe({
          next: (updated) => {
            this.loadUsers();
            if (this.selectedUser()?.id === user.id) {
              this.selectedUser.set({ ...this.selectedUser()!, ...updated } as UserDetail);
            }
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Could not deactivate.' });
          },
        });
      },
    });
  }

  reactivate(user: User) {
    this.confirmationService.confirm({
      message: `Reactivate ${user.name}? They will be able to log in again.`,
      header: 'Reactivate Member',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.adminService.reactivateUser(user.id).subscribe({
          next: (updated) => {
            this.loadUsers();
            if (this.selectedUser()?.id === user.id) {
              this.selectedUser.set({ ...this.selectedUser()!, ...updated } as UserDetail);
            }
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Could not reactivate.' });
          },
        });
      },
    });
  }

  updateUserRole(userId: string, role: string) {
    this.adminService.updateUser(userId, { role }).subscribe({
      next: (updated) => {
        this.loadUsers();
        if (this.selectedUser()?.id === userId) {
          this.selectedUser.set({ ...this.selectedUser()!, ...updated } as UserDetail);
        }
        this.messageService.add({ severity: 'success', summary: 'Role updated', detail: 'Member role has been updated.' });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Could not update role.' });
      },
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getRolePillClass(role: string): string {
    switch (role) {
      case 'MASTER': return 'pill--accent';
      case 'REVIEWER': return 'pill--info';
      default: return 'pill--secondary';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'MASTER': return 'Master';
      case 'REVIEWER': return 'Reviewer';
      case 'ADMIN': return 'Admin';
      default: return role;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
