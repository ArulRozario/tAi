import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full',
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/project-list.component').then(m => m.ProjectListComponent),
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./features/workbench/workbench.component').then(m => m.WorkbenchComponent),
  },
  {
    path: 'queue',
    loadComponent: () => import('./features/review-queue/review-queue.component').then(m => m.ReviewQueueComponent),
  },
];