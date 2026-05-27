import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  sidebarCollapsed = signal(false);
  mobileMenuOpen   = signal(false);

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  openMobileMenu()   { this.mobileMenuOpen.set(true);  }
  closeMobileMenu()  { this.mobileMenuOpen.set(false); }
  toggleMobileMenu() { this.mobileMenuOpen.update(v => !v); }
}
