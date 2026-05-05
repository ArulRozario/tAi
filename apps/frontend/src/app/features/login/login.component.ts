import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule],
  template: `
    <div class="fixed inset-0 flex items-center justify-center bg-slate-950 z-[100] animate-fade-in">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
      
      <div class="glass-card w-full max-w-[380px] p-8 space-y-8 relative overflow-hidden border-white/5 bg-slate-900/20 shadow-2xl">
        <div class="text-center space-y-3 relative">
          <div class="inline-flex p-3 bg-primary/5 rounded-xl border border-primary/10 mb-2">
            <i class="pi pi-shield text-2xl text-primary animate-pulse"></i>
          </div>
          <h1 class="text-2xl font-black text-white tracking-tighter uppercase">Intelligence <span class="text-primary italic">Portal</span></h1>
          <div class="flex items-center justify-center gap-2">
             <span class="micro-label">Authentication Node 01</span>
             <div class="w-1 h-1 rounded-full bg-emerald-500"></div>
          </div>
        </div>

        <form (ngSubmit)="login()" class="space-y-5 relative">
          <p-message *ngIf="error" severity="error" [text]="error" styleClass="w-full mb-4"></p-message>
          
          <div class="space-y-4">
            <div class="flex flex-col gap-2">
              <label for="email" class="micro-label px-1">Linguistic Identifier</label>
              <div class="relative group">
                <i class="pi pi-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 text-xs group-focus-within:text-primary transition-colors"></i>
                <input pInputText id="email" [(ngModel)]="email" name="email" class="w-full glass-input !h-10 !pl-10 !text-xs font-bold" placeholder="node-identifier" />
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <label for="password" class="micro-label px-1">Access Cipher</label>
                <a class="text-[8px] font-black text-primary hover:text-white uppercase tracking-widest cursor-pointer">Recover</a>
              </div>
              <div class="relative group">
                <i class="pi pi-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 text-xs group-focus-within:text-primary transition-colors"></i>
                <input pInputText id="password" type="password" [(ngModel)]="password" name="password" class="w-full glass-input !h-10 !pl-10 !text-xs font-bold" placeholder="••••••••" />
              </div>
            </div>
          </div>

          <button pButton label="Establish Secure Link" 
                  type="submit"
                  class="w-full !bg-primary !border-none !h-10 shadow-lg shadow-primary/20 font-black text-[10px] uppercase tracking-widest" 
                  [loading]="loading">
          </button>

          <div class="text-center pt-2">
             <p class="micro-label">
               UNAUTHORIZED ACCESS IS LOGGED &bull; <a class="text-primary hover:text-white cursor-pointer">REQUEST NODE</a>
             </p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .glass-input {
        background: rgba(15, 23, 42, 0.4) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        color: #f8fafc !important;
        border-radius: 12px !important;
        transition: all 0.3s ease;
        
        &:focus {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
        }
      }
      
      .p-input-icon-left > i {
        left: 0.75rem !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
      }
    }
  `]
})
export class LoginComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';
  loading = false;

  login() {
    this.loading = true;
    this.error = '';
    
    // Simple demo logic
    setTimeout(() => {
      if (this.email === 'admin@tai.com' && this.password === 'admin') {
        this.router.navigate(['/dashboard']);
      } else if (this.email && this.password) {
        // Just let them in for the demo if they typed something
         this.router.navigate(['/dashboard']);
      } else {
        this.error = 'Invalid email or password';
      }
      this.loading = false;
    }, 1000);
  }
}