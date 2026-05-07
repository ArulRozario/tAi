import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="p-8"><h1 class="text-2xl font-bold text-white">Projects</h1><p class="text-slate-400 mt-2">Project list — Phase 19</p></div>`,
})
export class ProjectListComponent {}
