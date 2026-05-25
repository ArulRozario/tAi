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
        title: 'Dashboard — tAI',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'projects',
        title: 'Projects — tAI',
        loadComponent: () => import('./projects/projects.component').then(m => m.ProjectsComponent),
      },
      {
        path: 'projects/:id',
        title: 'Project — tAI',
        loadComponent: () => import('./projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
      },
      {
        path: 'queue',
        title: 'Review Queue — tAI',
        loadComponent: () => import('./queue/queue.component').then(m => m.QueueComponent),
      },
      {
        path: 'style-guides',
        title: 'Style Guides — tAI',
        loadComponent: () => import('./style-guides/style-guides.component').then(m => m.StyleGuidesComponent),
      },
      {
        path: 'style-guides/create',
        title: 'New Style Guide — tAI',
        loadComponent: () => import('./style-guides/style-guide-detail.component').then(m => m.StyleGuideDetailComponent),
      },
      {
        path: 'style-guides/:id',
        title: 'Style Guide — tAI',
        loadComponent: () => import('./style-guides/style-guide-detail.component').then(m => m.StyleGuideDetailComponent),
      },
      {
        path: 'profile',
        title: 'Profile & Settings — tAI',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'admin/users',
        title: 'Team — tAI',
        loadComponent: () => import('./admin/users/users.component').then(m => m.UsersComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MASTER'] },
      },
      {
        path: 'admin/settings',
        title: 'Settings — tAI',
        loadComponent: () => import('./admin/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MASTER'] },
      },
      {
        path: 'workbench/:pageId',
        title: 'Workbench — tAI',
        loadComponent: () => import('./workbench/workbench.component').then(m => m.WorkbenchComponent),
        canActivate: [authGuard],
        data: { mode: 'browse' },
      },
      {
        path: 'review/:pageId',
        title: 'Review — tAI',
        loadComponent: () => import('./workbench/workbench.component').then(m => m.WorkbenchComponent),
        canActivate: [authGuard],
        data: { mode: 'queue' },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];