import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule } from '@angular/common';
import { PageThumbnailComponent } from '../page-thumbnail/page-thumbnail.component';
import { ProjectService, Page } from '../../../projects/projects.service';

@Component({
  selector: 'app-page-thumbnail-sidebar',
  standalone: true,
  imports: [CommonModule, PageThumbnailComponent],
  templateUrl: './page-thumbnail-sidebar.component.html',
  styleUrl: './page-thumbnail-sidebar.component.scss',
})
export class PageThumbnailSidebarComponent implements OnInit {
  private projectService = inject(ProjectService);

  projectId = input.required<string>();
  activePageId = input<string | null>(null);
  collapsed = input<boolean>(false);

  pageSelect = output<string>();
  collapsedChange = output<boolean>();

  pages = signal<Page[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadPages();
  }

  loadPages(): void {
    this.loading.set(true);
    this.projectService.getProjectPages(this.projectId(), 999).subscribe({
      next: (res) => {
        this.pages.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        faro.api?.pushError(new Error('Failed to load project pages for sidebar'), { context: { projectId: this.projectId(), error: String(err) } });
        this.loading.set(false);
      },
    });
  }

  onPageSelect(pageId: string): void {
    this.pageSelect.emit(pageId);
  }

  toggleCollapse(): void {
    this.collapsedChange.emit(!this.collapsed());
  }
}
