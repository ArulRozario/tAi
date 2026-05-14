import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuItem } from 'primeng/api';
import { StyleGuideService, StyleGuide } from '../projects/style-guide.service';
import { StyleGuideCardComponent } from './style-guide-card.component';

@Component({
  selector: 'app-styleGuides',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    BreadcrumbModule,
    IconFieldModule,
    InputIconModule,
    StyleGuideCardComponent
  ],
  templateUrl: './style-guides.component.html',
  styleUrl: './style-guides.component.scss'
})
export class StyleGuidesComponent implements OnInit {
  styleGuides = signal<StyleGuide[]>([]);
  breadcrumbItems: MenuItem[] = [{ label: 'tAI', routerLink: '/' }, { label: 'Style Guides' }];
  searchQuery = signal('');

  constructor(
    private styleGuideService: StyleGuideService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadStyleGuides();
  }

  loadStyleGuides() {
    this.styleGuideService.getStyleGuides().subscribe(data => {
      this.styleGuides.set(data);
    });
  }

  onSearch() {
    this.styleGuideService.getStyleGuides(this.searchQuery()).subscribe(data => {
      this.styleGuides.set(data);
    });
  }

  navigateToStyleGuide(id: string) {
    this.router.navigate(['/style-guides', id]);
  }

  navigateToCreate() {
    this.router.navigate(['/style-guides/create']);
  }
}
