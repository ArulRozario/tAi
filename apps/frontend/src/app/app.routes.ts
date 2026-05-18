import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppComponent } from './app.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
  },

  {
    path: '',
    component: AppComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'projects',
        loadComponent: () => import('./projects/projects.component').then(m => m.ProjectsComponent),
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
      },
      {
        path: 'queue',
        loadComponent: () => import('./queue/queue.component').then(m => m.QueueComponent),
      },
      {
        path: 'style-guides',
        loadComponent: () => import('./style-guides/style-guides.component').then(m => m.StyleGuidesComponent),
      },
      {
        path: 'style-guides/create',
        loadComponent: () => import('./style-guides/style-guide-detail.component').then(m => m.StyleGuideDetailComponent),
      },
      {
        path: 'style-guides/:id',
        loadComponent: () => import('./style-guides/style-guide-detail.component').then(m => m.StyleGuideDetailComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./admin/users/users.component').then(m => m.UsersComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MASTER'] },
      },
      {
        path: 'admin/settings',
        loadComponent: () => import('./admin/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MASTER'] },
      },
      {
        path: 'workbench/:pageId',
        loadComponent: () => import('./workbench/workbench.component').then(m => m.WorkbenchComponent),
        canActivate: [authGuard],
        data: { mode: 'browse' },
      },
      {
        path: 'review/:pageId',
        loadComponent: () => import('./workbench/workbench.component').then(m => m.WorkbenchComponent),
        canActivate: [authGuard],
        data: { mode: 'queue' },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];