import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule],
  template: `
    <div class="fixed inset-0 flex items-center justify-center bg-slate-950 z-[100]">
      <div class="w-full max-w-[380px] p-8 space-y-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur shadow-2xl">
        <div class="text-center">
          <i class="pi pi-lock text-3xl text-primary mb-3 block"></i>
          <h1 class="text-xl font-black text-white">Set new password</h1>
        </div>

        @if (done()) {
          <p-message severity="success" text="Password updated. Redirecting to login…" styleClass="w-full"></p-message>
        } @else {
          @if (error()) {
            <p-message severity="error" [text]="error()!" styleClass="w-full"></p-message>
          }
          <form (ngSubmit)="submit()" class="space-y-4">
            <div class="flex flex-col gap-1">
              <label class="text-xs text-slate-400 font-medium">New password</label>
              <input pInputText [(ngModel)]="password" name="password" type="password" placeholder="••••••••" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-slate-400 font-medium">Confirm password</label>
              <input pInputText [(ngModel)]="confirm" name="confirm" type="password" placeholder="••••••••" class="w-full" />
            </div>
            <button pButton label="Update password" type="submit" class="w-full" [loading]="loading()"></button>
          </form>
        }
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private token = '';
  password = '';
  confirm = '';

  loading = signal(false);
  error = signal<string | null>(null);
  done = signal(false);

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
  }

  submit() {
    if (!this.password || this.password !== this.confirm) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.done.set(true);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Reset link is invalid or expired.');
        this.loading.set(false);
      },
    });
  }
}
