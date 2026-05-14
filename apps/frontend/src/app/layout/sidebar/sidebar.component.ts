import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../theme.service';
import { LayoutService } from '../../layout.service';
import { AuthService, User } from '../../auth/auth.service';

/* Import PrimeNG Modules & types */
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
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
    AvatarModule,
    TooltipModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  public theme = inject(ThemeService);
  public layout = inject(LayoutService);
  public router = inject(Router);
  private authService = inject(AuthService);

  user: User | null = null;
  userInitials = '';

  /* Dynamic Menu Items array representing the dashboard sub-pages */
  sidebarMenuItems: MenuItem[] = [];

  ngOnInit() {
    const u = this.authService.getCurrentUser();
    this.user = u;
    this.userInitials = this.computeInitials(u?.name || '');
    this.buildMenu();
  }

  private buildMenu() {
    const workspaceItems: MenuItem[] = [
      { label: 'Dashboard', icon: 'pi pi-th-large', routerLink: '/dashboard' },
      { label: 'Projects', icon: 'pi pi-folder', routerLink: '/projects' },
      { label: 'Queue', icon: 'pi pi-list', routerLink: '/queue' },
      { label: 'Workbench', icon: 'pi pi-desktop', routerLink: '/workbench' },
    ];

    const adminItems: MenuItem[] = [
      { label: 'Style Guides', icon: 'pi pi-tags', routerLink: '/style-guides' },
      { label: 'User Management', icon: 'pi pi-users', routerLink: '/admin/users' },
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
