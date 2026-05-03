import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface LLMResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number;
  totalDuration?: number;
  loadDuration?: number;
  promptEvalDuration?: number;
  evalDuration?: number;
}

export interface EmbeddingResponse {
  embedding: number[];
}

export interface ModelInfo {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface ConnectionTestResult {
  online: boolean;
  latencyMs?: number;
  modelLoaded?: boolean;
  error?: string;
}

@Injectable()
export class OllamaService implements OnModuleInit {
  private baseUrl: string;
  private defaultModel: string = 'qwen2.5:7b';

  constructor(private httpService: HttpService) {
    this.baseUrl = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
  }

  async onModuleInit() {
    // Initialization
  }

  setDefaultModel(model: string) {
    this.defaultModel = model;
  }

  async generate(
    prompt: string,
    model?: string,
    options?: {
      temperature?: number;
      top_p?: number;
      top_k?: number;
      num_ctx?: number;
      max_tokens?: number;
      stop?: string[];
    },
  ): Promise<LLMResponse> {
    const modelToUse = model || this.defaultModel;

    try {
      const response = await firstValueFrom(
        this.httpService.post<LLMResponse>(
          `${this.baseUrl}/api/generate`,
          {
            model: modelToUse,
            prompt,
            stream: false,
            options: {
              temperature: options?.temperature ?? 0.3,
              top_p: options?.top_p ?? 0.9,
              top_k: options?.top_k ?? 40,
              num_ctx: options?.num_ctx ?? 8192,
              max_tokens: options?.max_tokens ?? 4096,
              stop: options?.stop,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      throw new Error(`Ollama generation failed: ${(error as Error).message}`);
    }
  }

  async chat(
    messages: { role: string; content: string }[],
    model?: string,
    options?: {
      temperature?: number;
      top_p?: number;
      num_ctx?: number;
    },
  ): Promise<LLMResponse> {
    const modelToUse = model || this.defaultModel;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/chat`,
          {
            model: modelToUse,
            messages,
            stream: false,
            options: {
              temperature: options?.temperature ?? 0.3,
              top_p: options?.top_p ?? 0.9,
              num_ctx: options?.num_ctx ?? 8192,
            },
          },
        ),
      );

      const data = response.data as any;
      return {
        model: data.model,
        response: data.message?.content || '',
        done: true,
      };
    } catch (error) {
      throw new Error(`Ollama chat failed: ${(error as Error).message}`);
    }
  }

  async getEmbedding(text: string, model: string = 'nomic-embed-text'): Promise<number[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<EmbeddingResponse>(
          `${this.baseUrl}/api/embeddings`,
          {
            model,
            prompt: text,
          },
        ),
      );

      return response.data.embedding;
    } catch (error) {
      throw new Error(`Ollama embedding failed: ${(error as Error).message}`);
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ models: ModelInfo[] }>(`${this.baseUrl}/api/tags`),
      );

      return response.data.models || [];
    } catch (error) {
      throw new Error(`Failed to list models: ${(error as Error).message}`);
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/tags`, { timeout: 5000 }),
      );

      const latency = Date.now() - startTime;

      return {
        online: true,
        latencyMs: latency,
        modelLoaded: true,
      };
    } catch (error) {
      return {
        online: false,
        latencyMs: undefined,
        modelLoaded: false,
        error: (error as Error).message,
      };
    }
  }

  async pullModel(model: string): Promise<{ status: string }> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/pull`,
          { name: model, stream: false },
        ),
      );

      return { status: 'success' };
    } catch (error) {
      throw new Error(`Failed to pull model: ${(error as Error).message}`);
    }
  }
}