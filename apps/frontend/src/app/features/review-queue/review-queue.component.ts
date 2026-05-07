import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-review-queue',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="p-8"><h1 class="text-2xl font-bold text-white">Review Queue</h1><p class="text-slate-400 mt-2">Queue screen — Phase 21</p></div>`,
})
export class ReviewQueueComponent {}
