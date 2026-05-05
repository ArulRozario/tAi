
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppTopbarComponent } from './app.topbar.component';
import { AppMenuComponent } from './app.menu.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AppTopbarComponent, AppMenuComponent],
  template: `
    <div class="layout-wrapper">
      <app-menu></app-menu>
      <div class="layout-main-container">
        <app-topbar></app-topbar>
        <div class="layout-content">
          <div class="layout-content-card">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AppLayoutComponent {}
