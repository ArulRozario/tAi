import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';

interface StatCard {
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  deltaLabel: string;
}

interface QueueItem {
  id: string;
  page: string;
  project: string;
  errors: number;
  priority: 'High' | 'Medium' | 'Low' | 'Crit';
  prioritySeverity: 'danger' | 'warn' | 'info' | 'secondary';
}

interface RecentProject {
  id: string;
  name: string;
  progress: number;
}

interface ActivityItem {
  user: string;
  initials: string;
  avatarBg: string;
  action: string;
  target: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    AvatarModule,
    ProgressBarModule,
    TagModule,
    TooltipModule,
    CardModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  userName = 'Ravi';
  lastSync = '2 min ago';

  stats: StatCard[] = [
    { label: 'Active projects', value: '12', delta: '+2', deltaUp: true, deltaLabel: 'this month' },
    { label: 'Pages transl.', value: '1,240', delta: '+132', deltaUp: true, deltaLabel: 'this wk' },
    { label: 'Pending review', value: '350', delta: '−18', deltaUp: false, deltaLabel: 'since Mo' },
    { label: 'Avg quality', value: '82%', delta: '+4pts', deltaUp: true, deltaLabel: '' },
  ];

  throughputMetric = 'Pages'; // or 'Words'
  throughputPeak = 132;
  throughputAvg = 88;
  throughputTotal = 1061;
  
  // Mock data for 12 weeks of bars (values 0-100 for height %)
  throughputData = [65, 78, 45, 92, 85, 70, 95, 88, 92, 60, 85, 100];

  queueItems: QueueItem[] = [
    { id: '1', page: 'P45', project: "Pilgrim's Progress", errors: 3, priority: 'Medium', prioritySeverity: 'info' },
    { id: '2', page: 'P46', project: "Pilgrim's Progress", errors: 2, priority: 'Low', prioritySeverity: 'secondary' },
    { id: '3', page: 'P12', project: 'Don Quixote', errors: 8, priority: 'High', prioritySeverity: 'warn' },
    { id: '4', page: 'P78', project: '1984', errors: 15, priority: 'Crit', prioritySeverity: 'danger' },
    { id: '5', page: 'P23', project: 'The Alchemist', errors: 5, priority: 'Medium', prioritySeverity: 'info' },
  ];

  recentProjects: RecentProject[] = [
    { id: '1', name: "Pilgrim's Progress", progress: 45 },
    { id: '2', name: 'Mere Christianity', progress: 100 },
    { id: '3', name: 'Don Quixote', progress: 25 },
    { id: '5', name: 'The Cost of Discipleship', progress: 0 },
  ];

  recentActivity: ActivityItem[] = [
    { user: 'Ravi Kumaran', initials: 'RK', avatarBg: '#f43f5e', action: 'approved', target: 'P12', time: '2m ago' },
    { user: 'Deepa A.', initials: 'DA', avatarBg: '#10b981', action: 'requested review for', target: 'P45', time: '5m ago' },
    { user: 'Manoj R.', initials: 'MR', avatarBg: '#3b82f6', action: 'escalated', target: 'P78', time: '12m ago' },
    { user: 'System', initials: 'AI', avatarBg: '#64748b', action: 'translated', target: 'Chapter 2', time: '1h ago' },
  ];

  setMetric(metric: string) {
    this.throughputMetric = metric;
  }
}
