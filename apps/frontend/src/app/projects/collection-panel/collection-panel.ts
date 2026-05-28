import {
  Component,
  inject,
  signal,
  computed,
  output,
  OnInit,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';

import {
  CollectionsService,
  CollectionNode,
  CreateCollectionDto,
  UpdateCollectionDto,
} from '../collections.service';
import { AuthService } from '../../auth/auth.service';

const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#f97316', '#ef4444',
];

@Component({
  selector: 'app-collection-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    DialogModule,
    SelectModule,
  ],
  templateUrl: './collection-panel.html',
  styleUrl: './collection-panel.scss',
})
export class CollectionPanel implements OnInit {
  /** Currently selected collection id (null = show all projects) */
  @Input() selectedId: string | null = null;

  readonly selectionChange = output<string | null>();
  readonly treeChange = output<void>(); // emitted after create/update/delete

  private readonly collectionsService = inject(CollectionsService);
  private readonly authService = inject(AuthService);

  tree = signal<CollectionNode[]>([]);
  loading = signal(false);

  /** Set of collection node IDs that are currently collapsed. */
  collapsedIds = signal(new Set<string>());

  toggleCollapse(id: string, event: Event): void {
    event.stopPropagation();
    this.collapsedIds.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Dialog state ──────────────────────────────────────────────────────────
  dialogVisible = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');
  editingNode = signal<CollectionNode | null>(null);

  formName = signal('');
  formDescription = signal('');
  formIcon = signal('📁');
  formColor = signal(PALETTE[0]);
  formParentId = signal<string | null>(null);
  formSaving = signal(false);

  readonly palette = PALETTE;

  readonly flatOptions = computed(() => {
    const flat = this.collectionsService.flattenTree(this.tree());
    return [
      { label: '— None (root level) —', value: null },
      ...flat.map((n) => ({
        label: ' '.repeat(n.depth * 4) + (n.icon ?? '📁') + ' ' + n.name,
        value: n.id,
      })),
    ];
  });

  readonly canManage = computed(() => {
    const u = this.authService.getCurrentUser();
    return u?.role === 'ADMIN' || u?.role === 'MASTER';
  });

  // ── Delete confirm ────────────────────────────────────────────────────────
  deleteDialogVisible = signal(false);
  deletingNode = signal<CollectionNode | null>(null);

  ngOnInit() {
    this.loadTree();
  }

  loadTree() {
    this.loading.set(true);
    this.collectionsService.getTree().subscribe({
      next: (nodes) => { this.tree.set(nodes); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  select(id: string | null) {
    this.selectionChange.emit(id);
  }

  // ── Create ────────────────────────────────────────────────────────────────
  openCreate(parentId: string | null = null) {
    this.dialogMode.set('create');
    this.editingNode.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formIcon.set('📁');
    this.formColor.set(PALETTE[0]);
    this.formParentId.set(parentId);
    this.dialogVisible.set(true);
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  openEdit(node: CollectionNode, event: Event) {
    event.stopPropagation();
    this.dialogMode.set('edit');
    this.editingNode.set(node);
    this.formName.set(node.name);
    this.formDescription.set(node.description ?? '');
    this.formIcon.set(node.icon ?? '📁');
    this.formColor.set(node.color ?? PALETTE[0]);
    this.formParentId.set(node.parentId);
    this.dialogVisible.set(true);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  save() {
    const name = this.formName().trim();
    if (!name) return;
    this.formSaving.set(true);

    if (this.dialogMode() === 'create') {
      const dto: CreateCollectionDto = {
        name,
        description: this.formDescription().trim() || undefined,
        icon: this.formIcon(),
        color: this.formColor(),
        parentId: this.formParentId() ?? undefined,
      };
      this.collectionsService.create(dto).subscribe({
        next: () => { this.afterSave(); },
        error: () => this.formSaving.set(false),
      });
    } else {
      const node = this.editingNode()!;
      const dto: UpdateCollectionDto = {
        name,
        description: this.formDescription().trim() || undefined,
        icon: this.formIcon(),
        color: this.formColor(),
        parentId: this.formParentId(),
      };
      this.collectionsService.update(node.id, dto).subscribe({
        next: () => { this.afterSave(); },
        error: () => this.formSaving.set(false),
      });
    }
  }

  private afterSave() {
    this.formSaving.set(false);
    this.dialogVisible.set(false);
    this.loadTree();
    this.treeChange.emit();
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(node: CollectionNode, event: Event) {
    event.stopPropagation();
    this.deletingNode.set(node);
    this.deleteDialogVisible.set(true);
  }

  executeDelete() {
    const node = this.deletingNode();
    if (!node) return;
    this.collectionsService.delete(node.id).subscribe({
      next: () => {
        this.deleteDialogVisible.set(false);
        this.deletingNode.set(null);
        if (this.selectedId === node.id) this.select(null);
        this.loadTree();
        this.treeChange.emit();
      },
    });
  }
}
