
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule],
  template: `
    <div class="layout-topbar">
      <div class="flex items-center gap-3">
        <button pButton icon="pi pi-bars" class="p-button-text !text-slate-600" (click)="toggleSidebar()"></button>
        <span class="text-lg font-bold text-slate-800">tAI</span>
      </div>
      <div class="flex items-center gap-4">
        <button pButton icon="pi pi-bell" class="p-button-text !text-slate-600"></button>
        <button pButton icon="pi pi-cog" class="p-button-text !text-slate-600"></button>
        <div class="flex items-center gap-2 pl-4 border-l border-slate-200">
          <span class="text-sm font-medium text-slate-600">Admin User</span>
          <p-avatar image="https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png" shape="circle"></p-avatar>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout-topbar {
      height: 60px;
      background: #ffffff;
      border-bottom: 1px solid var(--surface-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
    }
  `]
})
export class AppTopbarComponent {
  toggleSidebar() {
    // Logic to toggle sidebar will be handled by the layout component
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  }
}
