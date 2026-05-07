import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./features/login/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/project-list.component').then(m => m.ProjectListComponent),
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/workbench/workbench.component').then(m => m.WorkbenchComponent),
        data: { mode: 'browse' },
      },
      {
        path: 'workbench/:pageId',
        loadComponent: () => import('./features/workbench/workbench.component').then(m => m.WorkbenchComponent),
        data: { mode: 'browse' },
      },
      {
        path: 'review/:pageId',
        loadComponent: () => import('./features/workbench/workbench.component').then(m => m.WorkbenchComponent),
        data: { mode: 'queue' },
      },
      {
        path: 'queue',
        loadComponent: () => import('./features/review-queue/review-queue.component').then(m => m.ReviewQueueComponent),
      },
      {
        path: 'genres',
        loadComponent: () => import('./features/genres/genre-list.component').then(m => m.GenreListComponent),
      },
      {
        path: 'genres/:id',
        loadComponent: () => import('./features/genres/genre-editor.component').then(m => m.GenreEditorComponent),
      },
      {
        path: 'admin/team',
        loadComponent: () => import('./features/admin/team.component').then(m => m.TeamComponent),
        canActivate: [roleGuard],
        data: { roles: ['MASTER', 'ADMIN'] },
      },
      {
        path: 'admin/settings',
        loadComponent: () => import('./features/admin/settings.component').then(m => m.SettingsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
