import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ApiService, Genre } from '../../core/services/api.service';

const LANGUAGES: { code: string; name: string }[] = [
  { code: 'af', name: 'Afrikaans' }, { code: 'ar', name: 'Arabic' }, { code: 'bn', name: 'Bengali' },
  { code: 'bg', name: 'Bulgarian' }, { code: 'ca', name: 'Catalan' }, { code: 'zh', name: 'Chinese' },
  { code: 'hr', name: 'Croatian' }, { code: 'cs', name: 'Czech' }, { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' }, { code: 'en', name: 'English' }, { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' }, { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' }, { code: 'gu', name: 'Gujarati' }, { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' }, { code: 'hu', name: 'Hungarian' }, { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' }, { code: 'ja', name: 'Japanese' }, { code: 'kn', name: 'Kannada' },
  { code: 'ko', name: 'Korean' }, { code: 'lv', name: 'Latvian' }, { code: 'lt', name: 'Lithuanian' },
  { code: 'ms', name: 'Malay' }, { code: 'ml', name: 'Malayalam' }, { code: 'mr', name: 'Marathi' },
  { code: 'no', name: 'Norwegian' }, { code: 'fa', name: 'Persian' }, { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' }, { code: 'pa', name: 'Punjabi' }, { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' }, { code: 'sr', name: 'Serbian' }, { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' }, { code: 'es', name: 'Spanish' }, { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' }, { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' }, { code: 'tr', name: 'Turkish' }, { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' }, { code: 'vi', name: 'Vietnamese' },
];

@Component({
  selector: 'app-project-create-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, SelectModule, InputTextModule, ProgressBarModule],
  template: `
    <p-dialog [visible]="visible" (visibleChange)="close()" [modal]="true" [closable]="true"
              header="Create new project" [style]="{width: '640px'}" [draggable]="false">

      <div class="col gap-5 py-2">
        <!-- Name -->
        <div class="col gap-1.5">
          <label class="text-xs font-semibold text-text-2 uppercase tracking-wider">Project name</label>
          <input pInputText [(ngModel)]="form.name" placeholder="The Cost of Discipleship"
                 class="w-full !bg-surface-2 !border-border !text-text-1" />
        </div>

        <!-- Languages -->
        <div class="grid grid-cols-2 gap-4">
          <div class="col gap-1.5">
            <label class="text-xs font-semibold text-text-2 uppercase tracking-wider">Source language</label>
            <p-select [options]="languages" [(ngModel)]="form.sourceLang" optionLabel="name" optionValue="code"
                      [filter]="true" filterBy="name" placeholder="Select language"
                      [style]="{'width': '100%'}" styleClass="!bg-surface-2 !border-border">
            </p-select>
          </div>
          <div class="col gap-1.5">
            <label class="text-xs font-semibold text-text-2 uppercase tracking-wider">Target language</label>
            <p-select [options]="languages" [(ngModel)]="form.targetLang" optionLabel="name" optionValue="code"
                      [filter]="true" filterBy="name" placeholder="Select language"
                      [style]="{'width': '100%'}" styleClass="!bg-surface-2 !border-border">
            </p-select>
          </div>
        </div>

        <!-- Genre -->
        <div class="col gap-2">
          <label class="text-xs font-semibold text-text-2 uppercase tracking-wider">Genre</label>
          <div *ngFor="let g of genres" (click)="form.genreId = g.id"
               class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
               [class.border-primary]="form.genreId === g.id"
               [class.bg-accent-soft]="form.genreId === g.id"
               [class.border-border]="form.genreId !== g.id"
               [class.hover:border-surface-2]="form.genreId !== g.id">
            <input type="radio" [value]="g.id" [(ngModel)]="form.genreId" class="accent-primary" />
            <span class="text-xl w-8 text-center">{{ g.icon ?? '📄' }}</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-text-1 text-sm">{{ g.name }}</div>
              <div class="text-xs text-text-3 truncate">{{ g.description }}</div>
            </div>
            <span class="text-xs text-text-3 font-mono">{{ g.currentVersion?.versionNumber ?? 'v1.0' }}</span>
          </div>
          <div *ngIf="genres.length === 0" class="text-sm text-text-3 py-2">Loading genres…</div>
        </div>

        <!-- PDF dropzone -->
        <div class="col gap-1.5">
          <label class="text-xs font-semibold text-text-2 uppercase tracking-wider">Source document</label>
          <div class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
               [class.border-primary]="dragOver || selectedFile"
               [class.bg-accent-soft]="dragOver"
               [class.border-border]="!dragOver && !selectedFile"
               (dragover)="$event.preventDefault(); dragOver = true"
               (dragleave)="dragOver = false"
               (drop)="onDrop($event)"
               (click)="fileInput.click()">
            <input #fileInput type="file" accept=".pdf" class="hidden" (change)="onFileChange($event)" />
            <div *ngIf="!selectedFile">
              <i class="pi pi-upload text-3xl text-text-3 mb-3 block"></i>
              <div class="text-text-2 font-medium">Drop PDF here</div>
              <div class="text-text-3 text-sm mt-1">or <span class="text-primary">Browse files</span></div>
              <div class="text-text-3 text-xs mt-2">Scanned PDF · up to 500MB</div>
            </div>
            <div *ngIf="selectedFile" class="row justify-center gap-3">
              <i class="pi pi-file-pdf text-2xl text-primary"></i>
              <div class="text-left">
                <div class="text-text-1 font-medium text-sm">{{ selectedFile.name }}</div>
                <div class="text-text-3 text-xs">{{ (selectedFile.size / 1024 / 1024).toFixed(1) }} MB</div>
              </div>
              <button pButton icon="pi pi-times" [text]="true" severity="secondary" class="!p-1 !h-6 !w-6"
                      (click)="$event.stopPropagation(); selectedFile = null"></button>
            </div>
          </div>
        </div>

        <!-- Upload progress -->
        <p-progressBar *ngIf="uploading" [value]="uploadProgress" mode="indeterminate"></p-progressBar>
        <div *ngIf="error" class="text-error text-sm">{{ error }}</div>
      </div>

      <ng-template pTemplate="footer">
        <button pButton label="Cancel" [text]="true" severity="secondary" (click)="close()" [disabled]="uploading"></button>
        <button pButton label="Create project" severity="primary" (click)="submit()"
                [disabled]="!canSubmit || uploading" [loading]="uploading"></button>
      </ng-template>
    </p-dialog>
  `
})
export class ProjectCreateDialogComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() created = new EventEmitter<string>();

  private api = inject(ApiService);
  private router = inject(Router);

  languages = LANGUAGES;
  genres: Genre[] = [];
  selectedFile: File | null = null;
  dragOver = false;
  uploading = false;
  uploadProgress = 0;
  error: string | null = null;

  form = { name: '', sourceLang: '', targetLang: '', genreId: '' };

  get canSubmit(): boolean {
    return !!(this.form.name.trim() && this.form.sourceLang && this.form.targetLang && this.form.genreId);
  }

  ngOnInit() {
    this.api.getGenres(undefined, 50).subscribe({
      next: (g) => {
        this.genres = g;
        if (g.length > 0 && !this.form.genreId) this.form.genreId = g[0].id;
      },
      error: () => {},
    });
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.selectedFile = file;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file && file.type === 'application/pdf') this.selectedFile = file;
  }

  submit() {
    if (!this.canSubmit) return;
    this.error = null;
    this.uploading = true;

    const createProject = (fileId?: string) => {
      this.api.createProject({
        name: this.form.name.trim(),
        genreId: this.form.genreId,
        sourceLang: this.form.sourceLang,
        targetLang: this.form.targetLang,
        ...(fileId ? { sourceFileId: fileId } : {}),
      }).subscribe({
        next: (project) => {
          this.uploading = false;
          this.created.emit(project.id);
          this.router.navigate(['/projects', project.id]);
          this.close();
        },
        error: (err) => {
          this.uploading = false;
          this.error = err?.error?.message ?? 'Failed to create project.';
        },
      });
    };

    if (this.selectedFile) {
      this.api.uploadFile(this.selectedFile).subscribe({
        next: (res) => createProject(res.fileId),
        error: (err) => {
          this.uploading = false;
          this.error = err?.error?.message ?? 'File upload failed.';
        },
      });
    } else {
      createProject();
    }
  }

  close() {
    this.form = { name: '', sourceLang: '', targetLang: '', genreId: this.genres[0]?.id ?? '' };
    this.selectedFile = null;
    this.error = null;
    this.visibleChange.emit(false);
  }
}
