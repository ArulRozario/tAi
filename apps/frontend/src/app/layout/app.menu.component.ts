
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  template: `
    <div class="layout-sidebar" [class.collapsed]="collapsed">
      <div class="logo-container">
        <div class="logo-icon">P</div>
        <span *ngIf="!collapsed" class="logo-text">tAI</span>
      </div>
      <div class="menu-items">
        <a routerLink="/dashboard" routerLinkActive="active" class="menu-item">
          <i class="pi pi-home"></i>
          <span *ngIf="!collapsed">Dashboard</span>
        </a>
        <a routerLink="/projects" routerLinkActive="active" class="menu-item">
          <i class="pi pi-folder"></i>
          <span *ngIf="!collapsed">Projects</span>
        </a>
        <a routerLink="/queue" routerLinkActive="active" class="menu-item">
          <i class="pi pi-list"></i>
          <span *ngIf="!collapsed">Review Queue</span>
        </a>
        <a routerLink="/settings" routerLinkActive="active" class="menu-item">
          <i class="pi pi-cog"></i>
          <span *ngIf="!collapsed">Settings</span>
        </a>
      </div>
      <div class="menu-footer">
        <a routerLink="/login" class="menu-item text-rose-500">
          <i class="pi pi-sign-out"></i>
          <span *ngIf="!collapsed">Logout</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .layout-sidebar {
      width: 250px;
      background: #ffffff;
      border-right: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      transition: width 0.2s;
      height: 100vh;
      position: sticky;
      top: 0;
    }
    .layout-sidebar.collapsed {
      width: 80px;
    }
    .logo-container {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid var(--surface-border);
    }
    .logo-icon {
      width: 32px;
      height: 32px;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-weight: bold;
      font-size: 20px;
    }
    .logo-text {
      font-weight: 800;
      font-size: 20px;
      color: var(--text-color);
    }
    .menu-items {
      flex: 1;
      padding: 1rem 0;
    }
    .menu-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      color: var(--text-color-secondary);
      text-decoration: none;
      transition: all 0.2s;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .menu-item i {
      font-size: 1.2rem;
    }
    .menu-item:hover {
      background: #f3f4f6;
      color: var(--primary-color);
    }
    .menu-item.active {
      background: rgba(0, 191, 165, 0.1);
      color: var(--primary-color);
      border-right: 3px solid var(--primary-color);
    }
    .menu-footer {
      padding: 1rem 0;
      border-top: 1px solid var(--surface-border);
    }
  `]
})
export class AppMenuComponent {
  collapsed = false;

  constructor() {
    window.addEventListener('toggle-sidebar', () => {
      this.collapsed = !this.collapsed;
    });
  }
}
