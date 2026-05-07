import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule],
  template: `
    <div class="fixed inset-0 flex items-center justify-center bg-slate-950 z-[100]">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>

      <div class="w-full max-w-[380px] p-8 space-y-8 relative rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur shadow-2xl">
        <div class="text-center space-y-2">
          <div class="inline-flex p-3 bg-primary/5 rounded-xl border border-primary/10 mb-2">
            <i class="pi pi-shield text-2xl text-primary"></i>
          </div>
          <h1 class="text-2xl font-black text-white tracking-tighter">tAI <span class="text-primary">Platform</span></h1>
        </div>

        @if (!forgotMode()) {
          <form (ngSubmit)="login()" class="space-y-5">
            @if (error()) {
              <p-message severity="error" [text]="error()!" styleClass="w-full"></p-message>
            }
            <div class="flex flex-col gap-1">
              <label class="text-xs text-slate-400 font-medium">Email</label>
              <input pInputText [(ngModel)]="email" name="email" type="email" placeholder="you@example.com" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex justify-between">
                <label class="text-xs text-slate-400 font-medium">Password</label>
                <button type="button" class="text-xs text-primary hover:underline" (click)="forgotMode.set(true)">Forgot?</button>
              </div>
              <input pInputText [(ngModel)]="password" name="password" type="password" placeholder="••••••••" class="w-full" />
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="rememberMe" [(ngModel)]="rememberMe" name="rememberMe" class="accent-primary" />
              <label for="rememberMe" class="text-xs text-slate-400">Remember me for 30 days</label>
            </div>
            <button pButton label="Sign in" type="submit" class="w-full" [loading]="loading()"></button>
          </form>
        } @else {
          <form (ngSubmit)="sendReset()" class="space-y-5">
            @if (resetSent()) {
              <p-message severity="success" text="Reset link sent — check your email." styleClass="w-full"></p-message>
            } @else {
              @if (error()) {
                <p-message severity="error" [text]="error()!" styleClass="w-full"></p-message>
              }
              <div class="flex flex-col gap-1">
                <label class="text-xs text-slate-400 font-medium">Your email</label>
                <input pInputText [(ngModel)]="resetEmail" name="resetEmail" type="email" placeholder="you@example.com" class="w-full" />
              </div>
              <button pButton label="Send reset link" type="submit" class="w-full" [loading]="loading()"></button>
            }
            <button type="button" class="text-xs text-primary hover:underline w-full text-center" (click)="forgotMode.set(false)">Back to sign in</button>
          </form>
        }
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  rememberMe = false;
  resetEmail = '';

  loading = signal(false);
  error = signal<string | null>(null);
  forgotMode = signal(false);
  resetSent = signal(false);

  login() {
    if (!this.email || !this.password) {
      this.error.set('Email and password are required.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.email, this.password, this.rememberMe).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Invalid credentials.');
        this.loading.set(false);
      },
    });
  }

  sendReset() {
    if (!this.resetEmail) {
      this.error.set('Email is required.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.forgotPassword(this.resetEmail).subscribe({
      next: () => {
        this.resetSent.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.resetSent.set(true);
        this.loading.set(false);
      },
    });
  }
}
