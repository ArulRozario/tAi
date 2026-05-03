import { Routes } from '@angular/router';

export const routes: Routes = [
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
];