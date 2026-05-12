import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageService } from 'primeng/api';
import { StyleGuideService, StyleGuide } from '../style-guide.service';
import { ProjectService } from '../projects.service';

@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    RadioButtonModule,
  ],
  templateUrl: './create-project-modal.html',
  styleUrl: './create-project-modal.scss',
})
export class CreateProjectModal {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private styleGuideService = inject(StyleGuideService);
  private projectService = inject(ProjectService);
  private messageService = inject(MessageService);

  @Output() projectCreated = new EventEmitter<void>();

  visible = signal(false);
  loading = signal(false);
  styleGuides = signal<StyleGuide[]>([]);
  selectedFile: File | null = null;
  isDragOver = signal(false);
  fileError = signal<string | null>(null);

  readonly MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

  projectForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    sourceLang: ['en', Validators.required],
    targetLang: ['ta', Validators.required],
    styleGuideId: ['', Validators.required],
  });

  languages = [
    { label: 'English', value: 'en' },
    { label: 'Tamil', value: 'ta' },
  ];

  show() {
    this.visible.set(true);
    this.loadStyleGuides();
  }

  hide() {
    this.visible.set(false);
    this.projectForm.reset({
      name: '',
      sourceLang: 'en',
      targetLang: 'ta',
      styleGuideId: ''
    });
    this.selectedFile = null;
    this.fileError.set(null);
    this.isDragOver.set(false);
  }

  loadStyleGuides() {
    this.styleGuideService.getStyleGuides().subscribe({
      next: (styleGuides) => {
        this.styleGuides.set(styleGuides);
        if (styleGuides.length > 0 && !this.projectForm.get('styleGuideId')?.value) {
          this.projectForm.patchValue({ styleGuideId: styleGuides[0].id });
        }
      },
      error: (err) => faro.api?.pushError(new Error('Failed to load style guides in create-project modal'), { context: { error: String(err) } }),
    });
  }

  /** Validate and accept a file from click or drop */
  handleFile(file: File | null | undefined) {
    this.fileError.set(null);

    if (!file) {
      return;
    }

    // Validate type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.fileError.set('Only PDF files are supported.');
      return;
    }

    // Validate size
    if (file.size > this.MAX_FILE_SIZE) {
      this.fileError.set('File exceeds 200MB limit.');
      return;
    }

    this.selectedFile = file;
  }

  /** Triggered by the hidden native file input */
  onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.handleFile(file);
    // Reset input so the same file can be selected again
    input.value = '';
  }

  /** Click handler for the drop zone */
  onDropZoneClick() {
    const input = document.getElementById('project-file-input') as HTMLInputElement;
    input?.click();
  }

  /** Drag enter/over — prevent default to allow dropping */
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  /** Drag leave */
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  /** Drop handler */
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  /** Clear the selected file */
  clearFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileError.set(null);
  }

  onSubmit() {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    if (this.fileError()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: this.fileError()! });
      return;
    }

    if (!this.selectedFile) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please upload a PDF file.' });
      return;
    }

    this.loading.set(true);

    // 1. Upload File
    this.projectService.uploadFile(this.selectedFile).subscribe({
      next: (uploadRes) => {
        // 2. Create Project
        const formVal = this.projectForm.value;
        const createDto = {
          name: formVal.name!,
          sourceLang: formVal.sourceLang!,
          targetLang: formVal.targetLang!,
          styleGuideId: formVal.styleGuideId!,
          sourceFileId: uploadRes.fileId,
        };

        this.projectService.createProject(createDto).subscribe({
          next: (project) => {
            this.loading.set(false);
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Project created successfully.' });
            this.projectCreated.emit();
            this.hide();
            // Navigate to project detail page where extraction will run
            this.router.navigate(['/projects', project.id]);
          },
          error: (err) => {
            this.loading.set(false);
            const detail = err?.error?.message || 'Failed to create project.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail });
          },
        });
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.message || 'Failed to upload file.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }
}
