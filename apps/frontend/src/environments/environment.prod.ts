export const environment = {
  production: true,
  // Set to your Grafana Cloud collector URL to enable frontend observability.
  // Get it from: Grafana Cloud → Frontend Observability → Web SDK → collector URL
  // Leave empty ('') to disable Faro (safe default — main.ts guards on truthiness).
  faroUrl: '',
};
