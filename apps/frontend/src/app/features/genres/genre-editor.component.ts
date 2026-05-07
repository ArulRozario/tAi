import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import {
  ApiService, Genre, GenreVersion, GlossaryTerm, VersionDiff
} from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

type ViewMode = 'edit' | 'preview' | 'split' | 'diff';
type PanelMode = 'editor' | 'glossary';
type ChatMode = 'plan' | 'build';

interface DiffLine {
  type: '+' | '-' | ' ';
  text: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SEGMENT_OPTIONS = [
  { label: 'Verse', value: 'VERSE' },
  { label: 'Paragraph', value: 'PARAGRAPH' },
  { label: 'Page', value: 'PAGE' },
];

const QUICK_PROMPTS = [
  'Suggest improvements',
  'Review terminology coverage',
  'Find inconsistencies',
  'Add domain terms',
  'Compare with previous version',
];

@Component({
  selector: 'app-genre-editor',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, TextareaModule, DialogModule,
    SelectModule, TagModule, TooltipModule, SkeletonModule, AvatarModule,
  ],
  styles: [`
    :host { display: contents; }
    .genre-editor { display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: var(--bg); }
    .genre-editor__body { display: grid; grid-template-columns: 1fr 360px; flex: 1; min-height: 0; overflow: hidden; }
    .editor-pane { display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border); }
    .chat-pane { display: flex; flex-direction: column; overflow: hidden; background: var(--surface-1); }
    .md-preview { font-size: 14px; line-height: 1.8; padding: 24px; overflow-y: auto; flex: 1; }
    .md-preview h1 { font-size: 1.4em; font-weight: 700; margin-bottom: 0.5em; color: var(--text-1); }
    .md-preview h2 { font-size: 1.2em; font-weight: 600; margin-bottom: 0.4em; color: var(--text-1); margin-top: 1em; }
    .md-preview h3 { font-size: 1em; font-weight: 600; margin-bottom: 0.3em; color: var(--text-2); margin-top: 0.8em; }
    .md-preview p { color: var(--text-2); margin-bottom: 0.5em; }
    .md-preview table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
    .md-preview table th, .md-preview table td { border: 1px solid var(--border); padding: 4px 8px; font-size: 13px; }
    .md-preview table th { background: var(--surface-2); color: var(--text-1); font-weight: 600; }
    .md-preview table td { color: var(--text-2); }
    .diff-add { background: rgba(16,185,129,0.1); color: #10b981; border-left: 3px solid #10b981; padding-left: 6px; display: block; }
    .diff-del { background: rgba(239,68,68,0.1); color: #ef4444; border-left: 3px solid #ef4444; padding-left: 6px; display: block; text-decoration: line-through; }
    .diff-ctx { color: var(--text-2); padding-left: 9px; display: block; }
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; }
    .drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 360px; background: var(--surface-1); border-left: 1px solid var(--border); z-index: 50; display: flex; flex-direction: column; overflow: hidden; }
  `],
  template: `
    <!-- Test dialog -->
    <p-dialog header="Test translation" [(visible)]="showTest" [modal]="true"
              [style]="{width: '560px'}" [draggable]="false">
      <div class="flex flex-col gap-3 py-2">
        <label class="text-xs text-text-3 uppercase tracking-wider font-semibold">Sample text</label>
        <textarea pTextarea rows="5" [(ngModel)]="testInput"
                  placeholder="Enter sample text to translate…"
                  class="w-full !bg-surface-2 !border-border !text-text-1 text-sm resize-none"></textarea>
        <div *ngIf="testOutput" class="mt-2">
          <div class="text-xs text-text-3 uppercase tracking-wider font-semibold mb-1">Output</div>
          <div class="bg-surface-2 rounded-lg p-3 text-sm text-text-1 whitespace-pre-wrap">{{ testOutput }}</div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" [text]="true" (click)="showTest = false"></button>
        <button pButton label="Run test" icon="pi pi-play" severity="primary"
                [loading]="testing" [disabled]="!testInput.trim()"
                (click)="runTest()"></button>
      </ng-template>
    </p-dialog>

    <!-- Restore confirm dialog -->
    <p-dialog header="Restore version" [(visible)]="showRestoreConfirm" [modal]="true"
              [style]="{width: '400px'}" [draggable]="false">
      <p class="text-sm text-text-2 py-2">
        Restore <strong class="text-text-1">v{{ restoreTarget?.version }}</strong>? This creates a new version with the old content.
      </p>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" [text]="true" (click)="showRestoreConfirm = false"></button>
        <button pButton label="Restore" severity="warn" [loading]="restoring"
                (click)="submitRestore()"></button>
      </ng-template>
    </p-dialog>

    <!-- Version history drawer -->
    <div *ngIf="drawerOpen" class="drawer-overlay" (click)="drawerOpen = false"></div>
    <div *ngIf="drawerOpen" class="drawer fade-in">
      <div class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <div class="font-semibold text-text-1 text-sm">Version history</div>
          <div class="text-xs text-text-3">{{ genre()?.name }}</div>
        </div>
        <button pButton icon="pi pi-times" [text]="true" size="small" (click)="drawerOpen = false"></button>
      </div>
      <div class="flex-1 overflow-y-auto p-3">
        <div *ngFor="let v of versions()"
             class="rounded-lg p-3 mb-2 cursor-pointer border transition-colors"
             [class.border-accent]="selectedVersionId === v.id"
             [class.border-border]="selectedVersionId !== v.id"
             [class.bg-surface-2]="selectedVersionId === v.id"
             (click)="selectedVersionId = v.id">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2">
              <span class="font-mono text-sm font-bold text-text-1">v{{ v.version }}</span>
              <span *ngIf="genre()?.currentVersion?.id === v.id"
                    class="text-xs bg-accent text-white px-1.5 py-0.5 rounded-full">Current</span>
            </div>
            <span class="text-xs text-text-3">{{ relativeDate(v.createdAt) }}</span>
          </div>
          <p class="text-xs text-text-2 mb-1 italic" *ngIf="v.note">"{{ v.note }}"</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-3">by {{ v.createdBy?.name ?? 'Unknown' }}</span>
            <button pButton icon="pi pi-arrows-h" [text]="true" size="small"
                    pTooltip="View diff" (click)="$event.stopPropagation(); viewDiff(v)"></button>
          </div>
        </div>
      </div>
      <div class="px-3 py-3 border-t border-border flex gap-2 shrink-0">
        <button pButton label="Close" [text]="true" class="flex-1" (click)="drawerOpen = false"></button>
        <button pButton [label]="'Restore v' + (selectedVersionFor?.version ?? '—')"
                severity="warn" class="flex-1"
                [disabled]="!selectedVersionId || genre()?.currentVersion?.id === selectedVersionId || restoring"
                [loading]="restoring"
                (click)="confirmRestore()"></button>
      </div>
    </div>

    <div class="genre-editor">
      <!-- Toolbar -->
      <div class="toolbar">
        <button pButton icon="pi pi-arrow-left" [text]="true" size="small"
                (click)="goBack()" pTooltip="Back to genres"></button>
        <div class="toolbar__sep"></div>

        <!-- Breadcrumb + editable name -->
        <span class="text-xs text-text-3 mr-1">Genres /</span>
        <input *ngIf="genre()" [(ngModel)]="editName"
               (blur)="saveName()"
               (keydown.enter)="saveName()"
               class="bg-transparent border-none outline-none text-sm font-semibold text-text-1 w-48 focus:border-b focus:border-accent" />

        <div class="toolbar__sep"></div>

        <!-- Segment unit -->
        <p-select *ngIf="genre()"
                  [options]="segmentOptions"
                  [(ngModel)]="segmentUnit"
                  optionLabel="label" optionValue="value"
                  (onChange)="saveSegmentUnit()"
                  styleClass="!bg-surface-2 !border-border !text-text-1 !text-xs !h-7 w-32">
        </p-select>

        <!-- Version select -->
        <p-select *ngIf="genre() && versions().length > 0"
                  [options]="versionOptions()"
                  [(ngModel)]="activeVersionId"
                  optionLabel="label" optionValue="value"
                  (onChange)="onVersionSelect()"
                  styleClass="!bg-surface-2 !border-border !text-text-1 !text-xs !h-7 w-28">
        </p-select>

        <div class="toolbar__spacer"></div>

        <button pButton icon="pi pi-history" [text]="true" size="small"
                pTooltip="Version history" (click)="drawerOpen = true"></button>
        <button pButton icon="pi pi-book" [text]="true" size="small"
                pTooltip="Glossary"
                [class.text-accent]="panelMode === 'glossary'"
                (click)="toggleGlossary()"></button>
        <button pButton icon="pi pi-play" [text]="true" size="small"
                pTooltip="Test translation" (click)="showTest = true"></button>

        <div class="toolbar__sep"></div>

        <button pButton label="Save" icon="pi pi-check" severity="primary" size="small"
                [loading]="saving" [disabled]="!unsaved" (click)="saveVersion()"></button>
      </div>

      <!-- View mode tabs + status bar -->
      <div class="flex items-center px-4 py-1.5 border-b border-border bg-surface-1 gap-1 shrink-0">
        <button *ngFor="let tab of viewTabs" (click)="setViewMode(tab.value)"
                class="px-3 py-1 text-xs rounded transition-colors"
                [class.bg-surface-2]="viewMode === tab.value"
                [class.text-text-1]="viewMode === tab.value"
                [class.text-text-3]="viewMode !== tab.value">
          <i [class]="tab.icon + ' mr-1'"></i>{{ tab.label }}
        </button>
        <span *ngIf="viewMode === 'diff' && diffResult" class="text-xs text-text-3 ml-2">
          Showing changes v{{ diffResult.fromVersion }} → v{{ diffResult.toVersion }}
          <button pButton icon="pi pi-times" [text]="true" size="small"
                  (click)="closeDiff()"></button>
        </span>
        <div class="flex-1"></div>
        <span class="text-xs text-text-3 mono">
          {{ lineCount() }} lines · {{ charCount() }} chars
        </span>
      </div>

      <!-- Body -->
      <div class="genre-editor__body">
        <!-- Left pane: editor or glossary -->
        <div class="editor-pane">
          <!-- Glossary panel -->
          <ng-container *ngIf="panelMode === 'glossary'">
            <div class="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0">
              <span class="text-sm font-semibold text-text-1">Glossary</span>
              <span class="text-xs text-text-3">{{ glossaryTerms().length }} terms</span>
              <div class="flex-1"></div>
              <span class="p-input-icon-left">
                <i class="pi pi-search text-xs"></i>
                <input pInputText [(ngModel)]="glossarySearch" placeholder="Search terms…"
                       class="!bg-surface-2 !border-border !text-text-1 !text-xs !h-7 w-40" />
              </span>
              <button *ngIf="canEdit()" pButton icon="pi pi-plus" label="Add term" size="small"
                      [text]="true" (click)="startAddTerm()"></button>
              <label *ngIf="isAdmin()">
                <button pButton icon="pi pi-upload" label="Import CSV" size="small"
                        [text]="true" (click)="csvInput.click()"></button>
                <input #csvInput type="file" accept=".csv" class="hidden"
                       (change)="importCsv($event)" />
              </label>
            </div>
            <div class="flex-1 overflow-y-auto">
              <!-- Add term form -->
              <div *ngIf="addingTerm" class="flex items-center gap-2 px-4 py-2 bg-surface-2 border-b border-border">
                <input pInputText [(ngModel)]="termForm.sourceTerm" placeholder="Source term"
                       class="!bg-bg !border-border !text-text-1 !text-xs !h-7 w-32" />
                <input pInputText [(ngModel)]="termForm.targetTerm" placeholder="Target term"
                       class="!bg-bg !border-border !text-text-1 !text-xs !h-7 w-32" />
                <input pInputText [(ngModel)]="termForm.context" placeholder="Context (optional)"
                       class="!bg-bg !border-border !text-text-1 !text-xs !h-7 flex-1" />
                <button pButton label="Save" size="small" severity="primary" [loading]="savingTerm"
                        (click)="submitAddTerm()"></button>
                <button pButton label="Cancel" size="small" [text]="true"
                        (click)="addingTerm = false"></button>
              </div>
              <!-- Terms table -->
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-border bg-surface-2 sticky top-0">
                    <th class="text-left py-2 px-4 text-text-3 font-semibold uppercase tracking-wider">Source</th>
                    <th class="text-left py-2 px-4 text-text-3 font-semibold uppercase tracking-wider">Target</th>
                    <th class="text-left py-2 px-4 text-text-3 font-semibold uppercase tracking-wider">Context</th>
                    <th *ngIf="canEdit()" class="py-2 px-3 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container *ngFor="let term of filteredTerms()">
                    <!-- Edit row -->
                    <tr *ngIf="editingTermId === term.id" class="border-b border-border bg-surface-2">
                      <td class="py-1.5 px-3">
                        <input pInputText [(ngModel)]="termForm.sourceTerm"
                               class="!bg-bg !border-border !text-text-1 !text-xs !h-6 w-full" />
                      </td>
                      <td class="py-1.5 px-3">
                        <input pInputText [(ngModel)]="termForm.targetTerm"
                               class="!bg-bg !border-border !text-text-1 !text-xs !h-6 w-full" />
                      </td>
                      <td class="py-1.5 px-3">
                        <input pInputText [(ngModel)]="termForm.context"
                               class="!bg-bg !border-border !text-text-1 !text-xs !h-6 w-full" />
                      </td>
                      <td class="py-1.5 px-3">
                        <div class="flex gap-1">
                          <button pButton icon="pi pi-check" [text]="true" size="small"
                                  severity="success" [loading]="savingTerm"
                                  (click)="submitEditTerm(term)"></button>
                          <button pButton icon="pi pi-times" [text]="true" size="small"
                                  (click)="editingTermId = null"></button>
                        </div>
                      </td>
                    </tr>
                    <!-- View row -->
                    <tr *ngIf="editingTermId !== term.id"
                        class="border-b border-border hover:bg-surface-2 transition-colors">
                      <td class="py-2 px-4 text-text-1 font-medium">{{ term.sourceTerm }}</td>
                      <td class="py-2 px-4 text-text-2">{{ term.targetTerm }}</td>
                      <td class="py-2 px-4 text-text-3 ellipsis max-w-[180px]">{{ term.context ?? '—' }}</td>
                      <td *ngIf="canEdit()" class="py-2 px-3">
                        <div class="flex gap-1">
                          <button pButton icon="pi pi-pencil" [text]="true" size="small"
                                  (click)="startEditTerm(term)"></button>
                          <button pButton icon="pi pi-trash" [text]="true" size="small"
                                  severity="danger" (click)="deleteTerm(term)"></button>
                        </div>
                      </td>
                    </tr>
                  </ng-container>
                  <tr *ngIf="filteredTerms().length === 0">
                    <td [attr.colspan]="canEdit() ? 4 : 3"
                        class="py-8 text-center text-text-3">No terms found.</td>
                  </tr>
                </tbody>
              </table>
              <div *ngIf="glossaryHasMore()" class="flex justify-center py-4">
                <button pButton label="Load more" [text]="true" [loading]="loadingMoreTerms"
                        (click)="loadMoreTerms()"></button>
              </div>
            </div>
          </ng-container>

          <!-- Editor / Preview / Split / Diff -->
          <ng-container *ngIf="panelMode === 'editor'">
            <!-- Diff view -->
            <div *ngIf="viewMode === 'diff'" class="flex-1 overflow-y-auto p-4 font-mono text-xs">
              <div *ngIf="loadingDiff" class="text-text-3 py-4">Loading diff…</div>
              <div *ngFor="let line of parsedDiff()">
                <span [class.diff-add]="line.type === '+'"
                      [class.diff-del]="line.type === '-'"
                      [class.diff-ctx]="line.type === ' '">{{ line.text }}</span>
              </div>
            </div>

            <!-- Split or edit/preview -->
            <div *ngIf="viewMode !== 'diff'" class="flex flex-1 overflow-hidden">
              <!-- Markdown editor -->
              <div *ngIf="viewMode !== 'preview'" class="flex flex-col flex-1 overflow-hidden">
                <div class="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-surface-1 shrink-0">
                  <button *ngFor="let fmt of formatBtns"
                          pButton [text]="true" size="small" [pTooltip]="fmt.label"
                          (click)="insertFormat(fmt.value)" class="p-button-sm">
                    <span class="text-xs font-bold">{{ fmt.label }}</span>
                  </button>
                </div>
                <textarea class="flex-1 bg-bg border-none outline-none text-text-1 font-mono text-sm p-4 resize-none"
                          [(ngModel)]="editorContent"
                          (ngModelChange)="onEditorChange()"
                          spellcheck="false"
                          placeholder="Write genre translation guidelines in Markdown…">
                </textarea>
              </div>

              <!-- Preview -->
              <div *ngIf="viewMode !== 'edit'"
                   class="flex-1 overflow-y-auto border-l border-border"
                   [class.border-l-0]="viewMode === 'preview'">
                <div class="md-preview" [innerHTML]="renderedHtml()"></div>
              </div>
            </div>
          </ng-container>
        </div>

        <!-- Right pane: AI chat assistant -->
        <div class="chat-pane">
          <div class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div class="flex items-center gap-2">
              <i class="pi pi-sparkles text-accent"></i>
              <span class="font-semibold text-text-1 text-sm">Genre Assistant</span>
            </div>
            <!-- Plan / Build mode toggle -->
            <div class="flex rounded-md overflow-hidden border border-border">
              <button (click)="setChatMode('plan')"
                      class="px-2.5 py-1 text-xs transition-colors"
                      [class.bg-surface-2]="chatMode === 'plan'"
                      [class.text-text-1]="chatMode === 'plan'"
                      [class.text-text-3]="chatMode !== 'plan'">
                <i class="pi pi-comment mr-1"></i>Plan
              </button>
              <button (click)="setChatMode('build')"
                      class="px-2.5 py-1 text-xs transition-colors"
                      [class.bg-surface-2]="chatMode === 'build'"
                      [class.text-text-1]="chatMode === 'build'"
                      [class.text-text-3]="chatMode !== 'build'">
                <i class="pi pi-bolt mr-1"></i>Build
              </button>
            </div>
          </div>

          <!-- Chat thread -->
          <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            <div *ngFor="let msg of chatMessages()">
              <div *ngIf="msg.role === 'user'" class="flex justify-end">
                <div class="bg-accent text-white text-xs rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                  {{ msg.content }}
                </div>
              </div>
              <div *ngIf="msg.role === 'assistant'" class="flex items-start gap-2">
                <div class="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  <i class="pi pi-sparkles text-white" style="font-size:9px"></i>
                </div>
                <div class="bg-surface-2 text-xs rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] text-text-2 whitespace-pre-wrap">
                  {{ msg.content }}
                </div>
              </div>
            </div>
            <div *ngIf="chatMessages().length === 0" class="flex flex-col gap-2 mt-2">
              <p class="text-xs text-text-3 text-center">
                {{ chatMode === 'plan' ? 'Discuss before editing — ask questions or request suggestions.' : 'Build mode: AI will edit the genre doc directly.' }}
              </p>
            </div>
            <div *ngIf="chatLoading" class="flex items-center gap-2">
              <div class="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                <i class="pi pi-sparkles text-white" style="font-size:9px"></i>
              </div>
              <div class="text-xs text-text-3">Thinking…</div>
            </div>
          </div>

          <!-- Quick prompts -->
          <div class="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
            <button *ngFor="let qp of quickPromptsList()"
                    (click)="sendQuickPrompt(qp)"
                    class="text-xs px-2 py-1 rounded border border-border text-text-3 hover:text-text-2 hover:border-accent transition-colors">
              {{ qp }}
            </button>
          </div>

          <!-- AI Draft actions -->
          <div *ngIf="aiDraftContent()" class="px-3 pb-3 shrink-0">
            <div class="bg-surface-2 border border-success/30 rounded-xl p-3 flex flex-col gap-2">
              <div class="text-xs text-success font-medium flex items-center gap-1.5">
                <i class="pi pi-check-circle"></i>
                AI Revised Draft Available
              </div>
              <div class="text-xs text-text-3">
                The AI Genre Assistant has generated a revised draft of the genre guidelines based on your prompt.
              </div>
              <div class="flex gap-2 mt-1">
                <button pButton label="View Diff" icon="pi pi-arrows-h" size="small" [text]="true"
                        [disabled]="viewMode === 'diff'" (click)="viewAiDraftDiff()"></button>
                <button pButton label="Accept & Save" icon="pi pi-check" size="small" severity="success" class="flex-1"
                        (click)="saveAiDraft()"></button>
                <button pButton label="Discard" icon="pi pi-trash" size="small" severity="danger" [text]="true"
                        (click)="discardAiDraft()"></button>
              </div>
            </div>
          </div>

          <!-- Chat input -->
          <div class="px-3 pb-3 shrink-0">
            <div class="bg-surface-2 border border-border rounded-xl p-3 flex flex-col gap-2">
              <textarea [(ngModel)]="chatInput" rows="3"
                        placeholder="Ask about structure, gaps, terminology…"
                        class="w-full bg-transparent border-none outline-none text-sm text-text-1 resize-none"
                        (keydown.meta.enter)="sendChatMessage()"
                        (keydown.control.enter)="sendChatMessage()">
              </textarea>
              <div class="flex items-center justify-between">
                <span class="text-xs text-text-3">⌘↵ to send</span>
                <div class="flex gap-2">
                  <button pButton [label]="chatMode === 'plan' ? 'Discuss' : 'Build'"
                          [icon]="chatMode === 'plan' ? 'pi pi-comment' : 'pi pi-bolt'"
                          size="small" severity="primary"
                          [disabled]="!chatInput.trim() || chatLoading"
                          [loading]="chatLoading"
                          (click)="sendChatMessage()"></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class GenreEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly segmentOptions = SEGMENT_OPTIONS;
  readonly quickPrompts = QUICK_PROMPTS;
  readonly quickPromptsList = signal(QUICK_PROMPTS);
  readonly viewTabs = [
    { label: 'Split', value: 'split' as ViewMode, icon: 'pi pi-table' },
    { label: 'Edit', value: 'edit' as ViewMode, icon: 'pi pi-pencil' },
    { label: 'Preview', value: 'preview' as ViewMode, icon: 'pi pi-eye' },
  ];
  readonly formatBtns = [
    { label: 'B', value: 'bold' }, { label: 'I', value: 'italic' },
    { label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' },
  ];

  genreId = '';
  genre = signal<Genre | null>(null);
  versions = signal<GenreVersion[]>([]);
  glossaryTerms = signal<GlossaryTerm[]>([]);
  chatMessages = signal<ChatMessage[]>([]);
  chatSessionId = '';
  aiDraftContent = signal<string | null>(null);

  editName = '';
  segmentUnit = 'PAGE';
  activeVersionId = '';
  editorContent = '';
  unsaved = false;

  viewMode: ViewMode = 'split';
  panelMode: PanelMode = 'editor';
  chatMode: ChatMode = 'plan';

  saving = false;
  testing = false;
  restoring = false;
  chatLoading = false;
  loadingDiff = false;
  loadingMoreTerms = false;
  savingTerm = false;

  showTest = false;
  showRestoreConfirm = false;
  drawerOpen = false;

  testInput = '';
  testOutput = '';

  selectedVersionId: string | null = null;
  restoreTarget: GenreVersion | null = null;

  diffResult: VersionDiff | null = null;
  previousViewMode: ViewMode = 'split';

  chatInput = '';

  glossarySearch = '';
  glossaryOffset = 0;
  glossaryTotal = 0;
  addingTerm = false;
  editingTermId: string | null = null;
  termForm = { sourceTerm: '', targetTerm: '', context: '' };

  private contentChange$ = new Subject<void>();

  get selectedVersionFor(): GenreVersion | undefined {
    return this.versions().find(v => v.id === this.selectedVersionId);
  }

  versionOptions = computed(() =>
    this.versions().map(v => ({
      label: 'v' + v.version + (this.genre()?.currentVersion?.id === v.id ? ' · current' : ''),
      value: v.id,
    }))
  );

  lineCount = computed(() => this.editorContent.split('\n').length);
  charCount = computed(() => this.editorContent.length);

  filteredTerms = computed(() => {
    const q = this.glossarySearch.toLowerCase();
    return q
      ? this.glossaryTerms().filter(t =>
          t.sourceTerm.toLowerCase().includes(q) || t.targetTerm.toLowerCase().includes(q))
      : this.glossaryTerms();
  });

  glossaryHasMore = computed(() => this.glossaryTerms().length < this.glossaryTotal);

  parsedDiff = computed((): DiffLine[] => {
    if (!this.diffResult) return [];
    return this.diffResult.diff.split('\n').map((line): DiffLine => {
      if (line.startsWith('+')) return { type: '+', text: line.slice(1) };
      if (line.startsWith('-')) return { type: '-', text: line.slice(1) };
      return { type: ' ', text: line.slice(1) };
    });
  });

  renderedHtml = computed(() => {
    return this.markdownToHtml(this.editorContent);
  });

  canEdit = computed(() => this.auth.hasRole('MASTER', 'ADMIN'));
  isAdmin = computed(() => this.auth.hasRole('ADMIN'));

  viewAiDraftDiff() {
    console.log('viewAiDraftDiff stubbed');
  }

  saveAiDraft() {
    console.log('saveAiDraft stubbed');
  }

  discardAiDraft() {
    console.log('discardAiDraft stubbed');
  }

  setChatMode(mode: ChatMode) {
    this.chatMode = mode;
  }

  ngOnInit() {
    this.genreId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadGenre();

    this.contentChange$.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => { this.unsaved = true; });
  }

  private loadGenre() {
    this.api.getGenre(this.genreId).subscribe({
      next: (g) => {
        this.genre.set(g);
        this.editName = g.name;
        this.segmentUnit = (g as any).segmentUnit ?? 'PAGE';
        const versionsList = (g as any).versions ?? [];
        this.versions.set(versionsList);
        if (g.currentVersion) {
          this.activeVersionId = g.currentVersion.id;
          this.editorContent = g.currentVersion.content;
          this.unsaved = false;
        }
        this.loadGlossary();
        this.initChatSession();
      },
    });
  }

  private initChatSession() {
    this.api.getChatSessions('GENRE', this.genreId).subscribe({
      next: (sessions) => {
        if (sessions && sessions.length > 0) {
          this.chatSessionId = sessions[0].id;
          this.loadChatSessionMessages();
        } else {
          this.api.createChatSession({
            context: 'GENRE',
            entityId: this.genreId
          }).subscribe({
            next: (session) => {
              this.chatSessionId = session.id;
              this.chatMessages.set([]);
            }
          });
        }
      }
    });
  }

  private loadChatSessionMessages() {
    this.api.getChatSession(this.chatSessionId).subscribe({
      next: (session) => {
        if (session && session.messages) {
          this.chatMessages.set(session.messages.map((m: any) => ({
            role: m.role.toLowerCase() as 'user' | 'assistant',
            content: m.content
          })));
        }
      }
    });
  }

  private loadGlossary(reset = true) {
    if (reset) {
      this.glossaryOffset = 0;
      this.glossaryTerms.set([]);
    }
    this.api.getGlossary(this.genreId, 50, this.glossaryOffset).subscribe({
      next: (res) => {
        this.glossaryTotal = res.total;
        this.glossaryTerms.update(existing => reset ? res.data : [...existing, ...res.data]);
      },
    });
  }

  loadMoreTerms() {
    this.loadingMoreTerms = true;
    this.glossaryOffset += 50;
    this.api.getGlossary(this.genreId, 50, this.glossaryOffset).subscribe({
      next: (res) => {
        this.glossaryTotal = res.total;
        this.glossaryTerms.update(existing => [...existing, ...res.data]);
        this.loadingMoreTerms = false;
      },
      error: () => { this.loadingMoreTerms = false; },
    });
  }

  onEditorChange() {
    this.contentChange$.next();
  }

  setViewMode(mode: ViewMode) {
    if (mode !== 'diff') {
      this.previousViewMode = mode;
      this.diffResult = null;
    }
    this.viewMode = mode;
  }

  toggleGlossary() {
    this.panelMode = this.panelMode === 'glossary' ? 'editor' : 'glossary';
  }

  onVersionSelect() {
    const v = this.versions().find(vv => vv.id === this.activeVersionId);
    if (v) {
      this.editorContent = v.content;
      this.unsaved = false;
    }
  }

  saveName() {
    if (!this.editName.trim() || this.editName === this.genre()?.name) return;
    this.api.patchGenre(this.genreId, { name: this.editName.trim() } as any).subscribe({
      next: (g) => { this.genre.set(g); },
    });
  }

  saveSegmentUnit() {
    this.api.patchGenre(this.genreId, { segmentUnit: this.segmentUnit } as any).subscribe({
      next: (g) => { this.genre.set(g); },
    });
  }

  saveVersion() {
    if (!this.editorContent.trim()) return;
    this.saving = true;
    this.api.createGenreVersion(this.genreId, this.editorContent).subscribe({
      next: (v) => {
        this.saving = false;
        this.unsaved = false;
        this.versions.update(existing => [v, ...existing]);
        this.activeVersionId = v.id;
        this.genre.update(g => g ? { ...g, currentVersion: v } : g);
      },
      error: () => { this.saving = false; },
    });
  }

  runTest() {
    if (!this.testInput.trim()) return;
    this.testing = true;
    this.testOutput = '';
    this.api.testGenre(this.genreId, this.testInput).subscribe({
      next: (res) => {
        this.testing = false;
        this.testOutput = res.translation;
      },
      error: () => { this.testing = false; },
    });
  }

  viewDiff(version: GenreVersion) {
    this.loadingDiff = true;
    this.previousViewMode = this.viewMode !== 'diff' ? this.viewMode : this.previousViewMode;
    this.viewMode = 'diff';
    this.api.getVersionDiff(this.genreId, version.id).subscribe({
      next: (res) => {
        this.diffResult = res;
        this.loadingDiff = false;
      },
      error: () => { this.loadingDiff = false; },
    });
  }

  closeDiff() {
    this.viewMode = this.previousViewMode;
    this.diffResult = null;
  }

  confirmRestore() {
    if (!this.selectedVersionId) return;
    this.restoreTarget = this.versions().find(v => v.id === this.selectedVersionId) ?? null;
    this.showRestoreConfirm = true;
  }

  submitRestore() {
    if (!this.restoreTarget) return;
    this.restoring = true;
    this.api.restoreGenreVersion(this.genreId, this.restoreTarget.id).subscribe({
      next: (v) => {
        this.restoring = false;
        this.showRestoreConfirm = false;
        this.drawerOpen = false;
        this.versions.update(existing => [v, ...existing]);
        this.activeVersionId = v.id;
        this.editorContent = v.content;
        this.unsaved = false;
        this.genre.update(g => g ? { ...g, currentVersion: v } : g);
      },
      error: () => { this.restoring = false; },
    });
  }

  sendChatMessage() {
    const msg = this.chatInput.trim();
    if (!msg || this.chatLoading) return;
    this.chatInput = '';
    this.chatMessages.update(ms => [...ms, { role: 'user', content: msg }]);
    this.chatLoading = true;
    // Stub response — real SSE streaming integration deferred
    setTimeout(() => {
      const reply = this.chatMode === 'plan'
        ? `I've reviewed the genre guidelines. Here are some thoughts on "${msg}":\n\n1. The terminology section could benefit from more specific examples.\n2. Consider adding a "Common Pitfalls" section.\n3. The style guide is well-structured.`
        : `I'll help you update the genre document. For "${msg}", I recommend the following changes:\n\n[Draft edit would appear here with inline diffs in full implementation]`;
      this.chatMessages.update(ms => [...ms, { role: 'assistant', content: reply }]);
      this.chatLoading = false;
    }, 1200);
  }

  sendQuickPrompt(prompt: string) {
    this.chatInput = prompt;
    this.sendChatMessage();
  }

  // Glossary CRUD
  startAddTerm() {
    this.termForm = { sourceTerm: '', targetTerm: '', context: '' };
    this.editingTermId = null;
    this.addingTerm = true;
  }

  submitAddTerm() {
    if (!this.termForm.sourceTerm.trim() || !this.termForm.targetTerm.trim()) return;
    this.savingTerm = true;
    this.api.createGlossaryTerm({
      genreId: this.genreId,
      sourceTerm: this.termForm.sourceTerm.trim(),
      targetTerm: this.termForm.targetTerm.trim(),
      context: this.termForm.context.trim() || undefined,
    }).subscribe({
      next: (t) => {
        this.savingTerm = false;
        this.addingTerm = false;
        this.glossaryTerms.update(ts => [t, ...ts]);
        this.glossaryTotal++;
      },
      error: () => { this.savingTerm = false; },
    });
  }

  startEditTerm(term: GlossaryTerm) {
    this.editingTermId = term.id;
    this.termForm = { sourceTerm: term.sourceTerm, targetTerm: term.targetTerm, context: term.context ?? '' };
  }

  submitEditTerm(term: GlossaryTerm) {
    if (!this.termForm.sourceTerm.trim() || !this.termForm.targetTerm.trim()) return;
    this.savingTerm = true;
    this.api.updateGlossaryTerm(term.id, {
      sourceTerm: this.termForm.sourceTerm.trim(),
      targetTerm: this.termForm.targetTerm.trim(),
      context: this.termForm.context.trim() || undefined,
    }).subscribe({
      next: (updated) => {
        this.savingTerm = false;
        this.editingTermId = null;
        this.glossaryTerms.update(ts => ts.map(t => t.id === updated.id ? updated : t));
      },
      error: () => { this.savingTerm = false; },
    });
  }

  deleteTerm(term: GlossaryTerm) {
    this.api.deleteGlossaryTerm(term.id).subscribe({
      next: () => {
        this.glossaryTerms.update(ts => ts.filter(t => t.id !== term.id));
        this.glossaryTotal--;
      },
    });
  }

  importCsv(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.api.bulkImportGlossary(this.genreId, file).subscribe({
      next: () => { this.loadGlossary(); },
    });
  }

  insertFormat(type: string) {
    const t = this.editorContent;
    const suffix = type === 'h1' ? '# ' : type === 'h2' ? '## ' : type === 'h3' ? '### '
      : type === 'bold' ? '**text**' : '_text_';
    this.editorContent = t + (type.startsWith('h') ? '\n' + suffix : suffix);
    this.onEditorChange();
  }

  goBack() {
    this.router.navigate(['/genres']);
  }

  relativeDate(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return '1d ago';
    if (days < 7) return days + 'd ago';
    return Math.floor(days / 7) + 'w ago';
  }

  private markdownToHtml(md: string): string {
    if (!md) return '';
    let html = md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:var(--surface-2);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
      .replace(/^\|(.+)\|$/gm, (_, row) => {
        const cells = row.split('|').map((c: string) => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      })
      .replace(/(<tr>.*<\/tr>\n?)+/g, (match) => `<table>${match}</table>`)
      .replace(/^(?!<[h1-6t])(.*\S.*)$/gm, '<p>$1</p>');
    return html;
  }
}
