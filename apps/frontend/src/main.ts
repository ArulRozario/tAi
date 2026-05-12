import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';
import { environment } from './environments/environment';
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';

if (environment.faroUrl) {
  initializeFaro({
    url: environment.faroUrl,
    app: { name: 'tai-frontend', version: '1.0.0' },
    instrumentations: [...getWebInstrumentations()],
  });
}

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
