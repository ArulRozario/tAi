import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-review-detail',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="p-8"><h1 class="text-2xl font-bold text-white">Review</h1><p class="text-slate-400 mt-2">Review screen — Phase 22</p></div>`,
})
export class ReviewDetailComponent {}
