import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { Subject, Observable } from 'rxjs';

export interface ModelInfo {
  name: string;
  label: string;
  status: 'healthy' | 'exhausted';
  retryAt?: Date;
}

export interface ModelStatusEvent {
  type: 'refresh' | 'exhausted' | 'healthy';
  models?: ModelInfo[];
  model?: string;
  retryAt?: string;
}

@Injectable()
export class ModelRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ModelRegistryService.name);
  private readonly ai: GoogleGenAI;

  // Static in-memory cache (shared across all requests)
  private static models = new Map<string, ModelInfo>();
  private static exhausted = new Map<string, Date>();
  private static readonly REFRESH_INTERVAL_MS = 5 * 60 * 60 * 1000; // 5 hours
  private static readonly EXHAUSTION_COOLDOWN_MS = 5 * 60 * 60 * 1000; // 5 hours

  private statusSubject = new Subject<ModelStatusEvent>();
  readonly status$: Observable<ModelStatusEvent> = this.statusSubject.asObservable();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set. Model listing will fail.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async onModuleInit() {
    await this.refreshModels();
    setInterval(() => this.refreshModels(), ModelRegistryService.REFRESH_INTERVAL_MS);
  }

  /**
   * Fetch all generateContent models from Google API, sort by capability.
   */
  async refreshModels() {
    try {
      this.logger.log('Refreshing Gemini model list from API...');
      const pager = await this.ai.models.list({ config: { pageSize: 100 } });
      const fetched: ModelInfo[] = [];

      for await (const m of pager) {
        if (m.supportedActions?.includes('generateContent')) {
          const name = m.name || '';
          // Skip non-Gemini models (embeddings, image gen, etc.)
          if (!this.isGeminiModel(name)) continue;

          const info: ModelInfo = {
            name,
            label: m.displayName || name,
            status: this.isExhausted(name) ? 'exhausted' : 'healthy',
            retryAt: this.isExhausted(name) ? this.getRetryAt(name) : undefined,
          };
          fetched.push(info);
          ModelRegistryService.models.set(name, info);
        }
      }

      // Clean up models that no longer exist
      const currentNames = new Set(fetched.map((m) => m.name));
      for (const key of ModelRegistryService.models.keys()) {
        if (!currentNames.has(key)) {
          ModelRegistryService.models.delete(key);
          ModelRegistryService.exhausted.delete(key);
        }
      }

      this.logger.log(`Model registry refreshed: ${fetched.length} Gemini models.`);

      this.statusSubject.next({
        type: 'refresh',
        models: this.getAllModels(),
      });
    } catch (err) {
      this.logger.error(`Failed to refresh model list: ${(err as Error).message}`);
    }
  }

  /**
   * Mark a model as exhausted (quota hit).
   */
  markExhausted(modelName: string) {
    ModelRegistryService.exhausted.set(modelName, new Date());
    const info = ModelRegistryService.models.get(modelName);
    if (info) {
      info.status = 'exhausted';
      info.retryAt = this.getRetryAt(modelName);
    }
    this.statusSubject.next({
      type: 'exhausted',
      model: modelName,
      retryAt: this.getRetryAt(modelName)?.toISOString(),
    });
    this.logger.warn(`Model ${modelName} marked as exhausted.`);
  }

  /**
   * Check if a model is currently exhausted.
   */
  isExhausted(modelName: string): boolean {
    const exhaustedAt = ModelRegistryService.exhausted.get(modelName);
    if (!exhaustedAt) return false;
    const elapsed = Date.now() - exhaustedAt.getTime();
    if (elapsed >= ModelRegistryService.EXHAUSTION_COOLDOWN_MS) {
      // Cooldown expired
      ModelRegistryService.exhausted.delete(modelName);
      const info = ModelRegistryService.models.get(modelName);
      if (info) {
        info.status = 'healthy';
        info.retryAt = undefined;
      }
      this.statusSubject.next({ type: 'healthy', model: modelName });
      return false;
    }
    return true;
  }

  /**
   * Get the fallback chain: preferred model first, then sorted by capability.
   * Filters out exhausted models.
   */
  getFallbackChain(preferred?: string): string[] {
    const healthy = this.getAllModels()
      .filter((m) => m.status === 'healthy')
      .map((m) => m.name);

    // Sort by capability score (descending)
    healthy.sort((a, b) => this.scoreCapability(b) - this.scoreCapability(a));

    if (preferred && healthy.includes(preferred)) {
      // Move preferred to front
      return [preferred, ...healthy.filter((n) => n !== preferred)];
    }
    return healthy;
  }

  /**
   * Get all models (healthy + exhausted).
   */
  getAllModels(): ModelInfo[] {
    return Array.from(ModelRegistryService.models.values());
  }

  /**
   * Get only healthy models.
   */
  getHealthyModels(): ModelInfo[] {
    return this.getAllModels().filter((m) => m.status === 'healthy');
  }

  private isGeminiModel(name: string): boolean {
    const n = name.toLowerCase();
    return n.includes('gemini') || n.includes('gemma');
  }

  private scoreCapability(name: string): number {
    const n = name.toLowerCase();
    // Flash models first (fastest, cheapest)
    if (n.includes('flash')) return 100;
    // Experimental/preview flash
    if (n.includes('exp') && n.includes('flash')) return 95;
    // Pro models last (most capable but expensive/slower)
    if (n.includes('pro')) return 80;
    // Gemma models
    if (n.includes('gemma')) return 60;
    return 40;
  }

  private getRetryAt(modelName: string): Date | undefined {
    const exhaustedAt = ModelRegistryService.exhausted.get(modelName);
    if (!exhaustedAt) return undefined;
    return new Date(exhaustedAt.getTime() + ModelRegistryService.EXHAUSTION_COOLDOWN_MS);
  }
}
