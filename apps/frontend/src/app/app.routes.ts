import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
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
      },
      {
        path: 'workbench/:id',
        redirectTo: 'projects/:id',
      },
      {
        path: 'review/:id',
        loadComponent: () => import('./features/review-detail/review-detail.component').then(m => m.ReviewDetailComponent),
      },
      {
        path: 'queue',
        loadComponent: () => import('./features/review-queue/review-queue.component').then(m => m.ReviewQueueComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
      },
    ]
  },
];
