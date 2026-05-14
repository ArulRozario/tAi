import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ProjectService, CreateProjectDto } from '../projects.service';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    CardModule,
    ToastModule,
  ],
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.scss',
})
export class CreateProjectComponent {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(1000)]],
    sourceLang: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
    targetLang: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
    styleGuideId: ['', [Validators.required]],
    sourceFileId: [''],
  });

  // Mock styleGuides for now. In a real app, this would come from a StyleGuideService.
  styleGuides = [
    { label: 'Theological', value: 'uuid-1' },
    { label: 'Devotional', value: 'uuid-2' },
    { label: 'Academic', value: 'uuid-3' },
    { label: 'Literary', value: 'uuid-4' },
  ];

  onSubmit() {
    if (this.projectForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill in all required fields.' });
      return;
    }

    const dto: CreateProjectDto = this.projectForm.value;
    this.projectService.createProject(dto).subscribe({
      next: (project) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Project created successfully!' });
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create project.' });
      },
    });
  }

  onCancel() {
    this.router.navigate(['/projects']);
  }
}
