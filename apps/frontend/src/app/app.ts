import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, MenubarModule, ButtonModule],
  template: `
    <div class="min-h-screen bg-background text-gray-200">
      <p-menubar [model]="menuItems" class="border-none rounded-none bg-primary">
        <ng-template pTemplate="start">
          <span class="text-xl font-bold text-accent mr-4">tAI</span>
        </ng-template>
        <ng-template pTemplate="end">
          <button pButton label="Logout" icon="pi pi-sign-out" class="p-button-text" (click)="logout()"></button>
        </ng-template>
      </p-menubar>
      <router-outlet></router-outlet>
    </div>
  `,
})
export class App {
  menuItems = [
    { label: 'Projects', routerLink: '/projects' },
    { label: 'Review Queue', routerLink: '/queue' },
  ];

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}