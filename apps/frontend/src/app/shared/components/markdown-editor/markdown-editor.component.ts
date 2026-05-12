import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Milkdown
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import type { MilkdownPlugin } from '@milkdown/ctx';
import type { Ctx } from '@milkdown/ctx';
import {
  commonmark,
  toggleStrongCommand,
  toggleEmphasisCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  turnIntoTextCommand,
} from '@milkdown/preset-commonmark';
import { gfm, insertTableCommand } from '@milkdown/preset-gfm';
import { nord } from '@milkdown/theme-nord';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history, undoCommand, redoCommand } from '@milkdown/plugin-history';
import { clipboard } from '@milkdown/plugin-clipboard';

type ViewMode = 'wysiwyg' | 'split' | 'markdown';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.scss'],
})
export class MarkdownEditorComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('wysiwygPane', { static: false })
  wysiwygPane!: ElementRef<HTMLDivElement>;

  @Input() markdown = '';
  @Output() markdownChange = new EventEmitter<string>();
  @Input() placeholder = 'Start typing...';

  viewMode: ViewMode = 'wysiwyg';
  markdownSource = '';

  private milkdownEditor: Editor | null = null;
  private isUpdatingFromWysiwyg = false;
  private pendingMarkdown = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['markdown']) {
      const newValue = (changes['markdown'].currentValue ?? '') as string;
      this.markdownSource = newValue;
      if (this.viewMode !== 'markdown') {
        if (this.milkdownEditor) {
          this.refreshEditor(newValue);
        } else {
          // Defer until view is ready
          this.pendingMarkdown = newValue;
        }
      }
    }
  }

  async ngAfterViewInit() {
    if (this.viewMode !== 'markdown') {
      const content = this.pendingMarkdown || this.markdownSource;
      await this.refreshEditor(content);
    }
  }

  ngOnDestroy() {
    this.destroyEditor();
  }

  private async refreshEditor(markdown: string) {
    this.destroyEditor();

    // Find or create the editor container within the WYSIWYG pane
    let container = this.wysiwygPane?.nativeElement;
    if (!container) {
      faro.api?.pushError(new Error('Markdown editor container not found — genre editor will not render'));
      return;
    }

    // Clear existing content and create a fresh div for Milkdown
    container.innerHTML = '';
    const editorDiv = document.createElement('div');
    editorDiv.className = 'milkdown-container';
    container.appendChild(editorDiv);

    await this.createEditor(editorDiv, markdown);
  }

  private async createEditor(container: HTMLDivElement, initialMarkdown: string) {
    try {
      this.milkdownEditor = await Editor.make()
        .config((ctx: any) => {
          ctx.set(rootCtx, container);
          ctx.set(defaultValueCtx, initialMarkdown);
          ctx.get(listenerCtx).markdownUpdated((_ctx: any, newMarkdown: string, prevMarkdown: string) => {
            if (!this.isUpdatingFromWysiwyg) {
              this.isUpdatingFromWysiwyg = true;
              this.markdownSource = newMarkdown;
              this.markdownChange.emit(newMarkdown);
              this.isUpdatingFromWysiwyg = false;
            }
          });
        })
        .config(nord)
        .use(commonmark)
        .use(gfm)
        .use(listener)
        .use(history)
        .use(clipboard)
        .create();
    } catch (err) {
      faro.api?.pushError(new Error(`Markdown editor failed to initialize: ${String(err)}`));
    }
  }

  private destroyEditor() {
    if (this.milkdownEditor) {
      this.milkdownEditor.destroy();
      this.milkdownEditor = null;
    }
  }

  // ── Toolbar Actions ────────────────────────────────────────────

  private runCommand(command: any, payload?: any) {
    if (!this.milkdownEditor) return;
    this.milkdownEditor.action((ctx: any) => {
      const commands = (ctx as any).get(listenerCtx)?.manager?.get(listenerCtx)?.commands;
      if (commands && typeof commands.call === 'function') {
        commands.call(command, payload);
      }
    });
  }

  toggleBold() { this.runCommand(toggleStrongCommand.key); }
  toggleItalic() { this.runCommand(toggleEmphasisCommand.key); }
  setHeading(level: number) { this.runCommand(wrapInHeadingCommand.key, level); }
  setParagraph() { this.runCommand(turnIntoTextCommand.key); }
  toggleBulletList() { this.runCommand(wrapInBulletListCommand.key); }
  toggleOrderedList() { this.runCommand(wrapInOrderedListCommand.key); }
  toggleBlockquote() { this.runCommand(wrapInBlockquoteCommand.key); }
  insertTable() { this.runCommand(insertTableCommand.key); }
  undo() { this.runCommand(undoCommand.key); }
  redo() { this.runCommand(redoCommand.key); }

  // ── View Mode Switching ────────────────────────────────────────

  async setViewMode(mode: ViewMode) {
    const currentMode = this.viewMode;
    if (currentMode === mode) return;
    this.viewMode = mode;

    if (mode === 'markdown') {
      this.destroyEditor();
    } else {
      setTimeout(() => this.refreshEditor(this.markdownSource), 0);
    }
  }

  isActive(mode: ViewMode): boolean {
    return this.viewMode === mode;
  }

  // ── Markdown Textarea Events ───────────────────────────────────

  onMarkdownInput(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.markdownSource = value;
    this.markdownChange.emit(value);
  }
}
