import { Component, OnInit, inject, effect } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { MenuModule } from 'primeng/menu';
import { UiService } from './core/services/ui.service';
import { ApiService } from './core/services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, MenubarModule, ButtonModule, CommonModule, DialogModule, InputTextModule, FormsModule, MenuModule],
  template: `
    <div class="min-h-screen font-sans selection:bg-primary/30 relative text-slate-200 bg-slate-950">
      <!-- Global Background Effects -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div class="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[140px] animate-pulse"></div>
        <div class="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px]"></div>
        <div class="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[100px]"></div>
      </div>

      <!-- NAVIGATION: Intelligence Command Bar -->
      <header class="fixed top-0 left-0 w-full z-50 px-6 py-4" *ngIf="!isLoginPage()">
        <nav class="bg-surface-1/80 backdrop-blur-md h-14 rounded-2xl border border-border shadow-sm flex items-center justify-between px-6">
          <!-- BRAND -->
          <div class="flex items-center gap-3 cursor-pointer" routerLink="/">
            <span class="text-lg font-bold text-text-1 tracking-tight">tAI</span>
            <div class="w-px h-6 bg-border mx-2"></div>
          </div>

          <!-- NAV LINKS -->
          <div class="hidden md:flex items-center gap-1">
            <a routerLink="/dashboard" routerLinkActive="bg-surface-2 text-text-1" class="px-3 py-1.5 rounded-lg text-sm font-medium text-text-2 hover:text-text-1 hover:bg-surface-2 transition-colors">Dashboard</a>
            <a routerLink="/projects" routerLinkActive="bg-surface-2 text-text-1" class="px-3 py-1.5 rounded-lg text-sm font-medium text-text-2 hover:text-text-1 hover:bg-surface-2 transition-colors">Projects</a>
            <a routerLink="/queue" routerLinkActive="bg-surface-2 text-text-1" class="px-3 py-1.5 rounded-lg text-sm font-medium text-text-2 hover:text-text-1 hover:bg-surface-2 transition-colors">Queue</a>
            <a routerLink="/genres" routerLinkActive="bg-surface-2 text-text-1" class="px-3 py-1.5 rounded-lg text-sm font-medium text-text-2 hover:text-text-1 hover:bg-surface-2 transition-colors">Genres</a>
            
            <p-menu #adminMenu [model]="adminItems" [popup]="true"></p-menu>
            <button pButton label="Admin" icon="pi pi-chevron-down" iconPos="right" [text]="true" (click)="adminMenu.toggle($event)" class="!text-text-2 hover:!text-text-1"></button>
          </div>

          <!-- ACTIONS -->
          <div class="flex items-center gap-3">
            <button pButton icon="pi pi-power-off" [text]="true" (click)="logout()" class="!w-8 !h-8 !p-0 !text-text-2 hover:!text-error"></button>
          </div>
        </nav>
      </header>

      <!-- Main Content Container (Slim) -->
      <main [class.pt-24]="!isLoginPage()" class="min-h-screen px-4 md:px-6 max-w-none mx-auto animate-fade-in relative pb-12">
        <router-outlet></router-outlet>
      </main>

      <!-- Minimalist Footer -->
      <footer class="py-12 border-t border-white/5 text-center" *ngIf="!isLoginPage()">
        <div class="flex items-center justify-center gap-3 opacity-40 grayscale hover:grayscale-0 transition-all">
           <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
           <span class="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Operational Status: Optimal &bull; v0.4.2</span>
        </div>
      </footer>

      <!-- Global Project Initialization Dialog -->
      <p-dialog [(visible)]="displayNewProject" 
                [modal]="true" 
                [draggable]="false"
                [resizable]="false"
                [closable]="false"
                styleClass="glass-dialog">
        <ng-template pTemplate="header">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-3">
              <div class="w-8 h-1 bg-primary rounded-full"></div>
              <span class="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">Initialization Protocol</span>
            </div>
            <h2 class="text-4xl font-black text-white tracking-tighter">Initialize <span class="text-primary italic font-serif">Workflow</span></h2>
            <p class="text-slate-500 text-xs font-medium tracking-wide mt-1">Configure your document pipeline parameters.</p>
          </div>
        </ng-template>

        <div class="flex flex-col gap-10 py-8">
          <div class="flex flex-col gap-3">
            <label for="projectName" class="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">Project Identity</label>
            <input pInputText id="projectName" [(ngModel)]="newProject.name" placeholder="e.g. Q3 Financial Synthesis..." class="glass-input w-full !h-16 !px-8 !text-lg !font-bold" />
          </div>

          <div class="grid grid-cols-2 gap-8">
            <div class="flex flex-col gap-3">
              <label class="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-1 text-center lg:text-left">Source Pipeline</label>
              <div class="relative group">
                <i class="pi pi-globe absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"></i>
                <input pInputText [(ngModel)]="newProject.sourceLang" class="glass-input w-full !h-14 !pl-14 !px-6 !font-bold" />
              </div>
            </div>
            <div class="flex flex-col gap-3">
              <label class="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-1 text-center lg:text-left">Target Synthesis</label>
              <div class="relative group">
                <i class="pi pi-bolt absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"></i>
                <input pInputText [(ngModel)]="newProject.targetLang" class="glass-input w-full !h-14 !pl-14 !px-6 !font-bold text-primary" />
              </div>
            </div>
          </div>
          
          <div class="p-6 bg-primary/[0.03] border border-primary/10 rounded-3xl flex items-start gap-5 shadow-inner">
             <div class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <i class="pi pi-shield text-primary"></i>
             </div>
             <p class="text-xs text-slate-400 leading-relaxed font-medium">
               This configuration will initialize a new <span class="text-white font-black tracking-widest uppercase text-[9px] bg-white/5 px-2 py-1 rounded-lg">Draft Container</span>. Agents will be assigned based on synthesis requirements.
             </p>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="flex gap-6 justify-end items-center">
            <button pButton label="Abort Protocol" class="p-button-text !text-slate-600 hover:!text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all" (click)="ui.closeNewProjectDialog()"></button>
            <button pButton label="Initialize Container" icon="pi pi-check" (click)="createProject()" [loading]="creating" class="!bg-primary !border-none !h-14 !px-10 font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(99,102,241,0.3)] hover:scale-[1.02] transition-all active:scale-95"></button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .glass-menubar {
        background: rgba(15, 23, 42, 0.5) !important;
        backdrop-filter: blur(32px) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        border-radius: 24px !important;
        padding: 0.75rem 1.75rem !important;
        box-shadow: 0 30px 60px -15px rgba(0,0,0,0.6) !important;
      }
      
      .p-menubar .p-menuitem-link {
        padding: 0.75rem 1.5rem !important;
        border-radius: 16px !important;
        .p-menuitem-text { color: #64748b !important; font-weight: 800 !important; text-transform: uppercase; font-size: 11px; letter-spacing: 0.2em; transition: all 0.3s ease; }
        .p-menuitem-icon { color: #475569 !important; font-size: 14px !important; margin-right: 10px !important; transition: all 0.3s ease; }
        &:hover { background: rgba(255, 255, 255, 0.03) !important; .p-menuitem-text { color: #f8fafc !important; } .p-menuitem-icon { color: #6366f1 !important; } }
      }
      
      .p-menubar .p-menuitem.p-highlight .p-menuitem-link {
        background: rgba(99, 102, 241, 0.1) !important;
        .p-menuitem-text { color: #818cf8 !important; }
        .p-menuitem-icon { color: #6366f1 !important; }
      }

      .glass-input {
        background: rgba(15, 23, 42, 0.8) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        color: #f8fafc !important;
        border-radius: 18px !important;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        &:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15) !important; background: rgba(15, 23, 42, 0.9) !important; }
      }

      .glass-dialog {
        background: rgba(15, 23, 42, 0.98) !important;
        backdrop-filter: blur(48px) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow: 0 60px 120px -20px rgba(0, 0, 0, 0.9) !important;
        border-radius: 48px !important;
        width: 680px !important;
        overflow: hidden;
        
        .p-dialog-header { background: transparent !important; padding: 4rem 4rem 1rem !important; border: none !important; }
        .p-dialog-content { background: transparent !important; padding: 1rem 4rem !important; }
        .p-dialog-footer { background: transparent !important; border: none !important; padding: 1rem 4rem 4rem !important; }
      }
    }
  `]
})
export class AppComponent implements OnInit {
  ui = inject(UiService);
  private api = inject(ApiService);
  private router = inject(Router);
  
  displayNewProject = false;
  creating = false;
  newProject = { name: '', sourceLang: 'en', targetLang: 'ta', description: '', genreId: '' };

  adminItems: MenuItem[] = [
    { label: 'Team', icon: 'pi pi-users', routerLink: '/admin/team' },
    { label: 'Settings', icon: 'pi pi-cog', routerLink: '/admin/settings' }
  ];

  constructor() {
    effect(() => {
      const show = this.ui.showNewProjectDialog();
      // Use timeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.displayNewProject = show;
      });
    });
  }

  ngOnInit() {}

  isLoginPage(): boolean {
    return window.location.pathname === '/login';
  }

  logout() {
    this.router.navigate(['/login']);
  }

  createProject() {
    if (!this.newProject.name) return;
    this.creating = true;
    this.api.createProject(this.newProject).subscribe({
      next: (res) => {
        this.creating = false;
        this.ui.closeNewProjectDialog();
        this.router.navigate(['/projects', res.id]);
        this.newProject = { name: '', sourceLang: 'en', targetLang: 'ta', description: '', genreId: '' };
      },
      error: () => {
        this.creating = false;
      }
    });
  }
}