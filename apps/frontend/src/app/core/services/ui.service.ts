import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  showNewProjectDialog = signal(false);

  openNewProjectDialog() {
    this.showNewProjectDialog.set(true);
  }

  closeNewProjectDialog() {
    this.showNewProjectDialog.set(false);
  }
}
