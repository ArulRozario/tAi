import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent {
  @Input() initials = '';
  @Input() imageUrl: string | null | undefined = null;
  @Input() size: 'sm' | 'md' | 'lg' = 'sm';

  imgError = false;

  onImgError() {
    this.imgError = true;
  }
}
