import { Component, OnInit, AfterViewInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { StyleGuideService } from '../projects/style-guide.service';
import { MessageService } from 'primeng/api';
import { AiChatComponent } from '../shared/components/ai-chat/ai-chat.component';
import { AiChatService } from '../shared/components/ai-chat/ai-chat.service';
import { UnifiedChatService } from '../shared/components/ai-chat/unified-chat.service';
import { MarkdownEditorComponent } from '../shared/components/markdown-editor/markdown-editor.component';

@Component({
  selector: 'app-style-guide-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    AiChatComponent,
    MarkdownEditorComponent,
  ],
  providers: [
    UnifiedChatService,
    { provide: AiChatService, useExisting: UnifiedChatService },
  ],
  templateUrl: './style-guide-detail.component.html',
  styleUrl: './style-guide-detail.component.scss'
})
export class StyleGuideDetailComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private styleGuideService = inject(StyleGuideService);
  private messageService = inject(MessageService);
  private chatService = inject(AiChatService);
  private unifiedChat = inject(UnifiedChatService);

  segmentUnits = [
    { label: 'Verse', value: 'verse' },
    { label: 'Paragraph', value: 'paragraph' }
  ];
  selectedSegmentUnit = 'verse';

  versions: { label: string; value: string }[] = [];
  selectedVersion = '';

  isNew = signal<boolean>(false);
  styleGuideName = signal<string>('');
  styleGuideId = signal<string | null>(null);
  editorContent = signal<string>('');
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Resizable column state
  assistantWidth = signal<number>(360);
  workspaceWidth = signal<number>(1200);
  private isResizing = false;

  constructor(private route: ActivatedRoute) {
    effect(() => {
      const id = this.styleGuideId();
      if (id) {
        this.unifiedChat.configure({
          context: 'styleGuide',
          entityId: id,
          currentContent: this.editorContent(),
        });
      }
    });

    this.chatService.contentAccepted$.subscribe((content) => {
      this.editorContent.set(content);
    });
  }

  ngOnInit() {
    this.route.url.subscribe(segments => {
      const isCreate = segments.some(segment => segment.path === 'create');
      this.isNew.set(isCreate);

      if (isCreate) {
        this.styleGuideName.set('New Style Guide');
        this.editorContent.set(this.defaultTemplate());
      }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'create') {
        this.styleGuideId.set(id);
        this.loadStyleGuide(id);
      }
    });
  }

  ngAfterViewInit() {
    // Content is now loaded via loadStyleGuide() for existing styleGuides
    // or set in ngOnInit for new styleGuides
    this.updateWorkspaceWidth();
    window.addEventListener('resize', () => this.updateWorkspaceWidth());
  }

  private updateWorkspaceWidth() {
    const workspace = document.querySelector('.styleGuide-workspace') as HTMLElement;
    if (workspace) {
      this.workspaceWidth.set(workspace.clientWidth);
    }
  }

  expandEditor() {
    this.assistantWidth.set(360);
  }

  expandAssistant() {
    const width = this.workspaceWidth();
    this.assistantWidth.set(Math.min(360, width));
  }

  private loadStyleGuide(id: string) {
    this.isLoading.set(true);
    this.styleGuideService.getStyleGuide(id).subscribe({
      next: (styleGuide) => {
        this.styleGuideName.set(styleGuide.name);
        this.selectedSegmentUnit = styleGuide.segmentUnit || 'verse';
        this.editorContent.set(styleGuide.currentVersion?.content || '');
        this.isLoading.set(false);

        // Load versions list
        this.styleGuideService.getGenreVersions?.(id).subscribe({
          next: (versionList: any[]) => {
            this.versions = versionList.map(v => ({
              label: `v${v.version}${v.id === styleGuide.currentVersion?.id ? ' - current' : ''}`,
              value: v.version
            }));
            this.selectedVersion = styleGuide.currentVersion?.version || '';
          },
          error: () => {
            this.versions = [];
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load styleGuide.' });
      }
    });
  }

  private defaultTemplate(): string {
    return `# New Style Guide

## Overview
Describe the purpose and audience of this styleGuide.

## Core Rules
1. Rule one
2. Rule two
3. Rule three

## Terminology
| English | Target Language |
|---------|----------------|
| Example | Example        |
`;
  }

  saveGenre() {
    const content = this.editorContent();
    this.isSaving.set(true);

    if (this.isNew()) {
      if (!this.styleGuideName() || this.styleGuideName() === 'New Style Guide') {
        this.isSaving.set(false);
        return;
      }
      this.styleGuideService.createStyleGuide({
        name: this.styleGuideName(),
        segmentUnit: this.selectedSegmentUnit,
        content: content
      }).subscribe({
        next: (styleGuide) => {
          this.isSaving.set(false);
          this.router.navigate(['/style-guides', styleGuide.id]);
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
    } else {
      const id = this.styleGuideId();
      if (!id) {
        this.isSaving.set(false);
        return;
      }
      this.styleGuideService.createStyleGuideVersion(id, { content: content }).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.loadStyleGuide(id);
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
    }
  }

  // ── Resize handlers ────────────────────────────────────────────

  onResizeStart(event: MouseEvent) {
    event.preventDefault();
    this.isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const container = (event.target as HTMLElement).closest('.styleGuide-workspace') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const totalWidth = rect.width;

    const onMove = (e: MouseEvent) => {
      if (!this.isResizing) return;
      const newWidth = rect.right - e.clientX;
      // Clamp to full range, allowing either column to be fully hidden
      const clamped = Math.max(0, Math.min(totalWidth, newWidth));
      this.assistantWidth.set(clamped);
    };

    const onUp = () => {
      this.isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
}
