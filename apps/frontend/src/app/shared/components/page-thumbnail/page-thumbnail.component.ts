import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Page, ProjectService } from '../../../projects/projects.service';

@Component({
  selector: 'app-page-thumbnail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-thumbnail.component.html',
  styleUrl: './page-thumbnail.component.scss',
})
export class PageThumbnailComponent {
  private projectService = inject(ProjectService);

  page = input.required<Page>();
  projectId = input.required<string>();
  active = input<boolean>(false);

  select = output<string>();
  imageError = signal(false);

  get imageUrl(): string {
    const url = `/api/v1/projects/${this.projectId()}/pages/${this.page().pageNumber}/image`;
    return this.projectService.withToken(url);
  }

  get statusClass(): string {
    const status = this.page().status.toLowerCase();
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'human_review':
      case 'reviewing':
        return 'status-warn';
      case 'translated':
        return 'status-info';
      case 'pending':
      case 'extracted':
        return 'status-secondary';
      case 'translating':
      case 'extracting':
        return 'status-processing';
      case 'error':
      case 'rejected':
      case 'escalated':
        return 'status-danger';
      default:
        return 'status-secondary';
    }
  }

  onClick(): void {
    this.select.emit(this.page().id);
  }
}
