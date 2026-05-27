import { Component, OnInit, AfterViewInit, signal, inject, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { StyleGuideService, StyleGuideVersion } from '../projects/style-guide.service';
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
    TextareaModule,
    DialogModule,
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
  private cdr = inject(ChangeDetectorRef);

  segmentUnits = [
    { label: 'Verse', value: 'VERSE' },
    { label: 'Paragraph', value: 'PARAGRAPH' },
    { label: 'Page', value: 'PAGE' },
  ];
  selectedSegmentUnit = 'VERSE';

  versions: { label: string; value: string }[] = [];
  selectedVersion = '';
  versionList: StyleGuideVersion[] = [];

  showHistoryDialog = false;
  showTestDialog = false;
  testSampleText = '';
  testResult = signal<string | null>(null);
  isTesting = signal<boolean>(false);

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
      this.unifiedChat.configure({
        context: 'styleGuide',
        entityId: this.styleGuideId() ?? undefined,
        currentContent: this.editorContent(),
      });
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
        this.selectedSegmentUnit = styleGuide.segmentUnit || 'VERSE';
        this.editorContent.set(styleGuide.currentVersion?.content || '');
        this.isLoading.set(false);

        // Load versions list
        this.styleGuideService.getStyleGuideVersions(id).subscribe({
          next: (versionList: StyleGuideVersion[]) => {
            this.versionList = versionList;
            this.versions = versionList.map(v => ({
              label: `v${v.version}${v.id === styleGuide.currentVersion?.id ? ' (current)' : ''}`,
              value: v.id,
            }));
            this.selectedVersion = styleGuide.currentVersion?.id || '';
            this.cdr.detectChanges();
          },
          error: () => {
            this.versionList = [];
            this.versions = [];
            this.cdr.detectChanges();
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

## Purpose
Describe the purpose and target audience of this style guide.

## Core Rules
1. Rule one
2. Rule two
3. Rule three

## Terminology — Non-Negotiable Terms
| Source Term | Target Term | Notes |
|-------------|-------------|-------|
| Example     | Example     |       |

## Register
Describe the formality level and tone (e.g. formal, liturgical, conversational).

## Sentence Structure
Describe preferred sentence patterns, word order, and structural conventions.

## Proper Nouns
List proper nouns and their required translations or transliterations.

## Common Pitfalls
List frequent mistakes to avoid during translation.

## Examples
Provide before/after translation examples demonstrating the rules above.
`;
  }

  onVersionChange(versionId: string) {
    const version = this.versionList.find(v => v.id === versionId);
    if (version) {
      this.editorContent.set(version.content);
    }
  }

  openHistory() {
    this.showHistoryDialog = true;
  }

  openTest() {
    this.testSampleText = '';
    this.testResult.set(null);
    this.showTestDialog = true;
  }

  runTest() {
    const id = this.styleGuideId();
    if (!id || !this.testSampleText.trim()) return;
    this.isTesting.set(true);
    this.testResult.set(null);
    this.styleGuideService.testStyleGuide(id, this.testSampleText).subscribe({
      next: (result) => {
        this.testResult.set(result.translation);
        this.isTesting.set(false);
      },
      error: () => {
        this.isTesting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Translation test failed.' });
      }
    });
  }

  saveStyleGuide() {
    const content = this.editorContent();
    this.isSaving.set(true);

    if (this.isNew()) {
      const name = this.styleGuideName().trim();
      if (!name || name === 'New Style Guide') {
        this.messageService.add({ severity: 'warn', summary: 'Name required', detail: 'Enter a name before saving.' });
        this.isSaving.set(false);
        return;
      }
      this.styleGuideService.createStyleGuide({
        name: name,
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
      this.styleGuideService.patchStyleGuide(id, {
        segmentUnit: this.selectedSegmentUnit,
      }).subscribe();
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
