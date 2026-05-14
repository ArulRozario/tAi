import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { createTwoFilesPatch } from 'diff';
import { AiChatService } from './ai-chat.service';
import { ModelPickerComponent } from '../model-picker/model-picker.component';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  showActions?: boolean;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToggleSwitchModule, ModelPickerComponent],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss']
})
export class AiChatComponent {
  private sanitizer = inject(DomSanitizer);
  private chatService = inject(AiChatService);

  @Input() title: string = 'AI Assistant';
  @Input() greeting: string = 'Hi! How can I help you today?';
  @Input() showPlanMode: boolean = false;
  @Input() userInitials: string = 'U';
  @Input() placeholder: string = 'Message assistant...';
  @Input() currentContent: string = '';
  @Input() showDiff: boolean = false;

  messages = signal<ChatMessage[]>([]);
  isPlanMode = signal<boolean>(false);
  newMessage = signal<string>('');
  isTyping = signal<boolean>(false);
  selectedModel = signal<string>('');

  get planMode() {
    return this.isPlanMode();
  }

  constructor() {
    this.reset(this.greeting);
  }

  renderMarkdown(content: string): SafeHtml {
    if (!content) return '';
    const html = marked.parse(content) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /** Public API: reset the chat with a greeting */
  reset(greeting?: string) {
    this.messages.set([
      {
        id: this.makeId(),
        role: 'assistant',
        content: greeting || this.greeting,
        timestamp: new Date(),
      }
    ]);
  }

  /** Public API: set the greeting without clearing history */
  setGreeting(greeting: string) {
    this.messages.update(msgs => {
      if (msgs.length > 0 && msgs[0].role === 'assistant') {
        return [{ ...msgs[0], content: greeting }, ...msgs.slice(1)];
      }
      return msgs;
    });
  }

  /** Public API: add a user message to the chat */
  addUserMessage(text: string) {
    const msg: ChatMessage = {
      id: this.makeId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    this.messages.update(msgs => [...msgs, msg]);
  }

  /** Public API: begin an assistant response, returns the message id */
  beginAssistantResponse(): string {
    const id = this.makeId();
    const msg: ChatMessage = {
      id,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      showActions: true,
    };
    this.messages.update(msgs => [...msgs, msg]);
    this.isTyping.set(true);
    return id;
  }

  /** Public API: update the content of an in-flight assistant message */
  updateAssistantMessage(id: string, content: string) {
    this.messages.update(msgs =>
      msgs.map(m => m.id === id ? { ...m, content } : m)
    );
  }

  /** Public API: finalize an assistant message */
  finishAssistantMessage(id: string, content?: string) {
    if (content !== undefined) {
      this.messages.update(msgs =>
        msgs.map(m => m.id === id ? { ...m, content: this.formatMarkdown(content) } : m)
      );
    }
    this.isTyping.set(false);
  }

  /** Public API: set the typing/loading state */
  setLoading(loading: boolean) {
    this.isTyping.set(loading);
  }

  onPlanModeChange() {
    this.messages.update(msgs => {
      const updated = [...msgs];
      if (updated.length > 0 && updated[0].role === 'assistant') {
        updated[0] = {
          ...updated[0],
          content: this.isPlanMode()
            ? "I'm in **Plan** mode — I'll discuss proposed changes before writing anything. Toggle off to have me edit the document directly. What would you like to work on?"
            : this.greeting
        };
      }
      return updated;
    });
  }

  autoResize(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const text = this.newMessage().trim();
    if (!text || this.isTyping()) return;

    this.addUserMessage(text);
    this.newMessage.set('');
    this.chatService.sendPrompt(text, this.selectedModel(), this);
  }

  acceptMessage(id: string) {
    const msg = this.messages().find(m => m.id === id);
    if (msg) {
      this.chatService.acceptContent(msg.content, this);
      this.messages.update(msgs =>
        msgs.map(m => m.id === id ? { ...m, showActions: false } : m)
      );
    }
  }

  rejectMessage(id: string) {
    this.messages.update(msgs =>
      msgs.map(m => m.id === id ? { ...m, showActions: false } : m)
    );
  }

  retryMessage(id: string) {
    const msgs = this.messages();
    const idx = msgs.findIndex(m => m.id === id);
    if (idx < 1) return;
    const userContent = msgs[idx - 1].content;

    this.messages.update(list => list.filter(m => m.id !== id));
    this.chatService.sendPrompt(userContent, this.selectedModel(), this);
  }

  getDiffHtml(current: string, proposed: string): string {
    if (!current && !proposed) return '';
    const patch = createTwoFilesPatch('current', 'proposed', current || '', proposed || '', undefined, undefined, { context: 3 });
    return this.formatDiffToHtml(patch);
  }

  private formatDiffToHtml(patch: string): string {
    const lines = patch.split('\n').slice(4); // Skip header lines
    let html = '<div class="diff-view">';

    for (const line of lines) {
      if (line.startsWith('+')) {
        html += `<div class="diff-line diff-add">${this.escapeHtml(line)}</div>`;
      } else if (line.startsWith('-')) {
        html += `<div class="diff-line diff-del">${this.escapeHtml(line)}</div>`;
      } else if (line.startsWith('@@')) {
        html += `<div class="diff-line diff-hunk">${this.escapeHtml(line)}</div>`;
      } else {
        html += `<div class="diff-line diff-ctx">${this.escapeHtml(line)}</div>`;
      }
    }

    html += '</div>';
    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Post-processes raw model output into properly formatted markdown.
   * Fixes: missing blank lines, merged headings, malformed tables, etc.
   */
  formatMarkdown(raw: string): string {
    if (!raw) return raw;

    let text = raw;

    // Step 1: Normalize line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Step 2: Ensure blank line after headings
    text = text.replace(/^(#{1,6}\s.+)$/gm, (match, heading, offset, string) => {
      const after = string.slice(offset + match.length);
      const nextNonEmptyMatch = after.match(/\n\n?([^\n])/);
      if (nextNonEmptyMatch && nextNonEmptyMatch[1] !== '#' && !after.startsWith('\n\n')) {
        return heading + '\n';
      }
      return heading;
    });

    // Step 3: Fix walls of text — insert blank line before headings
    text = text.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');

    // Step 4: Fix walls of text — insert blank line before list items
    text = text.replace(/([^\n])\n([\-\*\+]\s)/g, '$1\n\n$2');
    text = text.replace(/([^\n])\n(\d+\.\s)/g, '$1\n\n$2');
    // Step 5: Ensure blank line after lists (before next block)
    text = text.replace(/([\-\*\+]\s.+\n)([^\n\s\-\*\+\d#\|])/g, '$1\n$2');
    text = text.replace(/(\d+\.\s.+\n)([^\n\s\-\*\+\d#\|])/g, '$1\n$2');

    // Step 6: Fix tables — ensure separator row and blank lines
    text = text.replace(/^(\|.+\|)\n(?!\|[\-\s]*\|)/gm, (match, headerRow) => {
      const colCount = headerRow.split('|').filter((c: string) => c.trim()).length;
      const separator = '|' + Array(colCount).fill('------').join('|') + '|';
      return headerRow + '\n' + separator;
    });

    // Step 7: Ensure blank line after tables
    text = text.replace(/(\|.+\|\n)([^\n\s#\|])/g, '$1\n$2');

    // Step 8: Remove multiple consecutive blank lines (max 2)
    text = text.replace(/\n{3,}/g, '\n\n');

    // Step 9: Ensure no trailing whitespace on lines
    text = text.replace(/[ \t]+$/gm, '');

    // Step 10: Ensure file ends with single newline
    text = text.replace(/\n*$/, '\n');

    return text;
  }

  private makeId(): string {
    return Math.random().toString(36).slice(2);
  }
}
