import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';
import { RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {
  readonly currentUrl = window.location.pathname;
}
if (environment.faroUrl) {
  initializeFaro({
    url: environment.faroUrl,
    app: { name: 'tai-frontend', version: '1.0.0' },
    instrumentations: [...getWebInstrumentations()],
  });
}

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
