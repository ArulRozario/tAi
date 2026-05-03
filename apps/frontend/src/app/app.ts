import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, MenubarModule],
  template: `
    <div class="min-h-screen bg-background text-gray-200">
      <p-menubar [model]="menuItems" class="border-none rounded-none bg-primary">
        <ng-template pTemplate="start">
          <span class="text-xl font-bold text-accent mr-4">tAI</span>
        </ng-template>
      </p-menubar>
      <router-outlet></router-outlet>
    </div>
  `,
})
export class App {
  menuItems = [
    { label: 'Projects', routerLink: '/projects' },
    { label: 'Queue', routerLink: '/queue' },
    { label: 'Admin', routerLink: '/admin' },
  ];
}