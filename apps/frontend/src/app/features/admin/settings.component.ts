import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="p-8"><h1 class="text-2xl font-bold text-white">Settings</h1><p class="text-slate-400 mt-2">Model & system settings — Phase 24</p></div>`,
})
export class SettingsComponent {}
