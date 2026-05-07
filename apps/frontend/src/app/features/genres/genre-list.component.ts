import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-genre-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="p-8"><h1 class="text-2xl font-bold text-white">Genres</h1><p class="text-slate-400 mt-2">Genre list — Phase 23</p></div>`,
})
export class GenreListComponent {}
