import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { StyleGuide } from '../projects/style-guide.service';

@Component({
  selector: 'app-style-guide-card',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule],
  templateUrl: './style-guide-card.component.html',
  styleUrl: './style-guide-card.component.scss'
})
export class StyleGuideCardComponent {
  @Input({ required: true }) styleGuide!: StyleGuide;
  @Output() cardClick = new EventEmitter<void>();

  onClick() {
    this.cardClick.emit();
  }

  timeAgo(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }
}
