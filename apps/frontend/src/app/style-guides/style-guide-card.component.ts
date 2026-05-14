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
  @Output() click = new EventEmitter<void>();

  onClick() {
    this.click.emit();
  }
}
