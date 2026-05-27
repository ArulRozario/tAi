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
import { CommonModule } from '@angular/common';
import EasyMDE from 'easymde';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.scss'],
})
export class MarkdownEditorComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('editorTextarea', { static: true })
  editorTextarea!: ElementRef<HTMLTextAreaElement>;

  @Input() markdown = '';
  @Output() markdownChange = new EventEmitter<string>();
  @Input() placeholder = 'Start typing...';

  private editor: EasyMDE | null = null;
  private suppressEmit = false;

  ngAfterViewInit() {
    this.editor = new EasyMDE({
      element: this.editorTextarea.nativeElement,
      initialValue: this.markdown,
      placeholder: this.placeholder,
      autofocus: false,
      spellChecker: false,
      sideBySideFullscreen: false,
      syncSideBySidePreviewScroll: true,
      toolbar: [
        'bold', 'italic', 'heading', '|',
        'quote', 'unordered-list', 'ordered-list', '|',
        'link', 'table', 'horizontal-rule', '|',
        'preview', 'side-by-side', 'fullscreen', '|',
        'guide',
      ],
    });

    this.editor.codemirror.on('change', () => {
      if (!this.suppressEmit) {
        this.markdownChange.emit(this.editor!.value());
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['markdown'] && this.editor) {
      const incoming = changes['markdown'].currentValue ?? '';
      if (incoming !== this.editor.value()) {
        this.suppressEmit = true;
        this.editor.value(incoming);
        this.suppressEmit = false;
      }
    }
  }

  ngOnDestroy() {
    this.editor?.toTextArea();
    this.editor = null;
  }
}
