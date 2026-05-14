import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Standalone Angular Signal tracking dark mode state
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    // Check local storage selection
    const savedTheme = localStorage.getItem('theme');
    // Check operating system setting safely (handles SSR and test environments)
    const prefersDark = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;

    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    this.setTheme(shouldBeDark);
  }

  toggleTheme() {
    this.setTheme(!this.isDarkMode());
  }

  private setTheme(isDark: boolean) {
    this.isDarkMode.set(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Dynamically toggle class on document root html tag
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
