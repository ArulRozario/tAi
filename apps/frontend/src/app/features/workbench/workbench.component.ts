import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-workbench',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-white">Workbench</h1>
      <p class="text-slate-400 mt-2">Page ID: {{ pageId }} — Phase 20</p>
    </div>
  `,
})
export class WorkbenchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  pageId = '';
  mode = 'browse';

  ngOnInit() {
    this.pageId = this.route.snapshot.paramMap.get('pageId') ?? this.route.snapshot.paramMap.get('id') ?? '';
    this.mode = this.route.snapshot.data['mode'] ?? 'browse';
  }
}
