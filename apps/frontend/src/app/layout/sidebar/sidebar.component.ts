import { Component, inject, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../theme.service';
import { LayoutService } from '../../layout.service';
import { AuthService, User } from '../../auth/auth.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

/* Import PrimeNG Modules & types */
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MenuModule,
    ButtonModule,
    TooltipModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  public theme = inject(ThemeService);
  public layout = inject(LayoutService);
  public router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);

  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  user: User | null = null;
  userInitials = '';

  /* Dynamic Menu Items array representing the dashboard sub-pages */
  sidebarMenuItems: MenuItem[] = [];

  ngOnInit() {
    this.authService.user$.subscribe(u => {
      this.user = u;
      this.userInitials = this.computeInitials(u?.name || '');
      this.cdr.markForCheck();
    });
    this.buildMenu();
  }

  triggerAvatarUpload() {
    this.avatarInput.nativeElement.click();
  }

  onAvatarFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.authService.uploadAvatar(file).subscribe();
    (event.target as HTMLInputElement).value = '';
  }

  onAvatarError() {
    if (this.user) {
      this.user = { ...this.user, avatarUrl: null };
    }
  }

  private buildMenu() {
    const workspaceItems: MenuItem[] = [
      { label: 'Dashboard', icon: 'pi pi-th-large', routerLink: '/dashboard' },
      { label: 'Projects', icon: 'pi pi-folder', routerLink: '/projects' },
      { label: 'Queue', icon: 'pi pi-list', routerLink: '/queue' },
      {
        label: 'Workbench',
        icon: 'pi pi-desktop',
        command: () => this.openWorkbench(),
      },
    ];

    const adminItems: MenuItem[] = [
      { label: 'Style Guides', icon: 'pi pi-tags', routerLink: '/style-guides' },
      { label: 'Team', icon: 'pi pi-users', routerLink: '/admin/users' },
      { label: 'Settings', icon: 'pi pi-sliders-h', routerLink: '/admin/settings' },
    ];

    const showAdmin = this.user && ['ADMIN', 'MASTER'].includes(this.user.role);

    this.sidebarMenuItems = [
      { label: 'WORKSPACE', items: workspaceItems },
      ...(showAdmin ? [{ label: 'ADMIN', items: adminItems }] : []),
      {
        label: 'ACCOUNT',
        items: [
          { label: 'Profile', icon: 'pi pi-user', routerLink: '/profile' },
          {
            label: 'Sign out',
            icon: 'pi pi-power-off',
            command: () => this.logout(),
          },
        ],
      },
    ];
  }

  openWorkbench() {
    const currentUrl = this.router.url;
    if (currentUrl.startsWith('/workbench/') || currentUrl.startsWith('/review/')) {
      return; // already in workbench
    }
    // Workbench requires a pageId — send the user to the queue first,
    // then projects as a fallback if they have no assignments.
    this.router.navigateByUrl('/queue');
  }

  logout() {
    this.authService.logout();
  }

  isActive(link: string): boolean {
    return this.router.url === link || this.router.url.startsWith(link + '/');
  }

  private computeInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
