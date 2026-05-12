import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { ApiService, Genre } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

const ICON_OPTIONS = ['📖', '⚖', '🏥', '🔬', '💼', '🎭', '📜', '🌐'];
const COLOR_OPTIONS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#db2777'];

@Component({
  selector: 'app-genre-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, SkeletonModule],
  template: `
    <!-- New Genre Dialog -->
    <p-dialog header="New genre" [(visible)]="showCreate" [modal]="true"
              [style]="{width: '480px'}" [draggable]="false" [closable]="true"
              styleClass="!bg-surface-1 !border-border">
      <div class="flex flex-col gap-4 py-2">
        <div>
          <label class="text-xs text-text-3 uppercase tracking-wider font-semibold mb-1 block">Name</label>
          <input pInputText [(ngModel)]="newName" placeholder="Literary Translation"
                 class="w-full !bg-surface-2 !border-border !text-text-1" />
        </div>
        <div>
          <label class="text-xs text-text-3 uppercase tracking-wider font-semibold mb-1 block">Key (slug)</label>
          <input pInputText [(ngModel)]="newKey" placeholder="literary-translation"
                 class="w-full !bg-surface-2 !border-border !text-text-1" />
        </div>
        <div>
          <label class="text-xs text-text-3 uppercase tracking-wider font-semibold mb-1 block">Description</label>
          <input pInputText [(ngModel)]="newDescription" placeholder="Short description…"
                 class="w-full !bg-surface-2 !border-border !text-text-1" />
        </div>
        <div>
          <label class="text-xs text-text-3 uppercase tracking-wider font-semibold mb-2 block">Icon</label>
          <div class="flex gap-2 flex-wrap">
            <button *ngFor="let icon of iconOptions"
                    (click)="newIcon = icon"
                    class="w-10 h-10 rounded-lg border text-xl transition-colors flex items-center justify-center"
                    [class.border-accent]="newIcon === icon"
                    [class.border-border]="newIcon !== icon">{{ icon }}</button>
          </div>
        </div>
        <div>
          <label class="text-xs text-text-3 uppercase tracking-wider font-semibold mb-2 block">Color</label>
          <div class="flex gap-2 flex-wrap">
            <button *ngFor="let c of colorOptions"
                    (click)="newColor = c"
                    class="w-7 h-7 rounded-full border-2 transition-all"
                    [style.background]="c"
                    [class.border-white]="newColor === c"
                    [class.border-transparent]="newColor !== c"></button>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" [text]="true" (click)="showCreate = false"></button>
        <button pButton label="Create genre" severity="primary"
                [disabled]="!newName.trim() || !newKey.trim() || creating"
                [loading]="creating"
                (click)="createGenre()"></button>
      </ng-template>
    </p-dialog>

    <div class="page fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Genres</h1>
          <p class="page-subtitle">Translation contexts that drive agent behavior · {{ genres().length }} defined</p>
        </div>
        <div class="row gap-3">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input pInputText [(ngModel)]="search" placeholder="Search genres"
                   class="!bg-surface-2 !border-border !text-text-1 !w-56" />
          </span>
          <button *ngIf="canCreate()" pButton icon="pi pi-plus" label="New genre"
                  severity="primary" (click)="openCreate()"></button>
        </div>
      </div>

      <!-- Loading skeletons -->
      <div *ngIf="loading" class="grid--3 gap-6">
        <div *ngFor="let _ of [1,2,3]" class="card">
          <div class="flex items-center justify-between mb-3">
            <p-skeleton shape="circle" size="2.5rem"></p-skeleton>
            <p-skeleton width="3rem" height="1.25rem"></p-skeleton>
          </div>
          <p-skeleton height="1.25rem" class="mb-2"></p-skeleton>
          <p-skeleton height="1rem" width="80%" class="mb-4"></p-skeleton>
          <p-skeleton height="1px" class="mb-3"></p-skeleton>
          <p-skeleton height="0.875rem" width="60%"></p-skeleton>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && filtered().length === 0"
           class="flex flex-col items-center justify-center py-24 gap-3">
        <i class="pi pi-book text-text-3 text-4xl"></i>
        <p class="text-text-2 text-sm">No genres found.</p>
        <button *ngIf="canCreate() && search" pButton label="Clear search" [text]="true"
                (click)="search = ''"></button>
      </div>

      <!-- Genre cards -->
      <div *ngIf="!loading && filtered().length > 0" class="grid--3 gap-6">
        <div *ngFor="let genre of filtered()"
             class="card cursor-pointer hover:border-accent transition-colors group"
             (click)="openEditor(genre.id)">
          <!-- Top row: icon + version -->
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                 [style.background]="(genre.color ?? '#7c3aed') + '22'">
              {{ genre.icon ?? '📖' }}
            </div>
            <span class="text-xs font-mono text-text-3 bg-surface-2 px-2 py-0.5 rounded border border-border">
              v{{ genre.currentVersion?.version ?? '1.0' }}
            </span>
          </div>
          <!-- Name + description -->
          <div class="font-semibold text-text-1 mb-1">{{ genre.name }}</div>
          <div class="text-xs text-text-2 mb-4 min-h-[2.5rem] line-clamp-2">
            {{ genre.description ?? 'No description.' }}
          </div>
          <hr class="border-border mb-3">
          <!-- Footer meta -->
          <div class="flex items-center justify-between text-xs text-text-3">
            <span>{{ genre._count?.projects ?? 0 }} project{{ (genre._count?.projects ?? 0) !== 1 ? 's' : '' }}</span>
            <span>
              Updated {{ relativeDate(genre.updatedAt ?? genre.createdAt ?? '') }}
              <span *ngIf="genre.createdBy?.name"> · by {{ genre.createdBy!.name!.split(' ')[0] }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class GenreListComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly iconOptions = ICON_OPTIONS;
  readonly colorOptions = COLOR_OPTIONS;

  genres = signal<Genre[]>([]);
  loading = true;
  search = '';

  showCreate = false;
  creating = false;
  newName = '';
  newKey = '';
  newDescription = '';
  newIcon = '📖';
  newColor = '#7c3aed';

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    return q ? this.genres().filter(g => g.name.toLowerCase().includes(q)) : this.genres();
  });

  canCreate = computed(() => this.auth.hasRole('MASTER', 'ADMIN'));

  ngOnInit() {
    this.api.getGenres(undefined, 100).subscribe({
      next: (data) => { this.genres.set(data); this.loading = false; },
      error: (err) => { this.loading = false; faro.api?.pushError(new Error('Failed to load genres list'), { context: { error: String(err) } }); },
    });
  }

  openEditor(id: string) {
    this.router.navigate(['/genres', id]);
  }

  openCreate() {
    this.newName = '';
    this.newKey = '';
    this.newDescription = '';
    this.newIcon = '📖';
    this.newColor = '#7c3aed';
    this.showCreate = true;
  }

  createGenre() {
    if (!this.newName.trim() || !this.newKey.trim()) return;
    this.creating = true;
    this.api.createGenre({
      name: this.newName.trim(),
      key: this.newKey.trim().toLowerCase().replace(/\s+/g, '-'),
      description: this.newDescription.trim() || undefined,
      icon: this.newIcon,
      color: this.newColor,
    }).subscribe({
      next: (g) => {
        this.creating = false;
        this.showCreate = false;
        this.router.navigate(['/genres', g.id]);
      },
      error: (err) => { this.creating = false; faro.api?.pushError(new Error('Failed to create genre'), { context: { error: String(err) } }); },
    });
  }

  relativeDate(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return '1d ago';
    if (days < 7) return days + 'd ago';
    if (days < 30) return Math.floor(days / 7) + 'w ago';
    return Math.floor(days / 30) + 'mo ago';
  }
}
