import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, ButtonModule, MessageModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background">
      <p-card styleClass="w-full max-w-md" styleClass="bg-surface-card border border-surface-700">
        <ng-template pTemplate="header">
          <div class="text-center py-6">
            <h1 class="text-3xl font-bold text-accent">tAI</h1>
            <p class="text-gray-400 mt-2">Tamil Translation AI</p>
          </div>
        </ng-template>
        
        <div class="flex flex-col gap-4">
          <p-message *ngIf="error" severity="error" [text]="error" styleClass="w-full"></p-message>
          
          <div class="flex flex-col gap-2">
            <label for="email" class="text-gray-300">Email</label>
            <input pInputText id="email" [(ngModel)]="email" placeholder="Enter your email" class="w-full" type="email" />
          </div>
          
          <div class="flex flex-col gap-2">
            <label for="password" class="text-gray-300">Password</label>
            <input pInputText id="password" [(ngModel)]="password" placeholder="Enter your password" class="w-full" type="password" />
          </div>
          
          <button pButton label="Sign In" (click)="login()" [loading]="loading" class="w-full mt-2"></button>
          
          <div class="text-center mt-4">
            <a href="#" class="text-accent text-sm hover:underline">Forgot Password?</a>
          </div>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-card {
      background: #1f1f3a;
    }
    :host ::ng-deep .p-inputtext, :host ::ng-deep .p-password-input {
      background: #1a1a2e;
      border-color: #2a2a4a;
      color: #eaeaea;
    }
    :host ::ng-deep .p-password-input {
      width: 100%;
    }
  `]
})
export class LoginComponent {
  private router = inject(Router);
  
  email = '';
  password = '';
  loading = false;
  error = '';

  login() {
    if (!this.email || !this.password) {
      this.error = 'Please enter email and password';
      return;
    }

    this.loading = true;
    this.error = '';

    // Mock login - in production would call auth API
    setTimeout(() => {
      if (this.email === 'admin@tai.com' && this.password === 'admin') {
        localStorage.setItem('token', 'mock-jwt-token');
        this.router.navigate(['/projects']);
      } else {
        this.error = 'Invalid credentials';
      }
      this.loading = false;
    }, 1000);
  }
}