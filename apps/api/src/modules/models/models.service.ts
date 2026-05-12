import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from '../agents/ollama.service';
import { GeminiService } from '../agents/gemini.service';
import { AgentType, Provider, ModelConfig } from '@prisma/client';
import { encrypt } from '../auth/crypto.util';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ModelsService implements OnModuleInit {
  private readonly logger = new Logger(ModelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    public readonly ollama: OllamaService,
    private readonly gemini: GeminiService,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit() {
    const existingConfigsCount = await this.prisma.modelConfig.count();
    if (existingConfigsCount > 0) {
      return;
    }

    this.logger.log('Seeding default ModelConfig values');

    const defaultSeedData = [
      {
        agentType: AgentType.TRANSLATION,
        provider: Provider.OLLAMA,
        modelName: 'qwen2.5:7b',
        isActive: true,
        isDefault: true,
      },
      {
        agentType: AgentType.REVIEW,
        provider: Provider.OLLAMA,
        modelName: 'qwen2.5:7b',
        isActive: true,
        isDefault: true,
      },
      {
        agentType: AgentType.CHAT,
        provider: Provider.OLLAMA,
        modelName: 'qwen2.5:7b',
        isActive: true,
        isDefault: true,
      },
      {
        agentType: AgentType.EMBEDDING,
        provider: Provider.OLLAMA,
        modelName: 'nomic-embed-text',
        isActive: true,
        isDefault: true,
      },
    ];

    for (const item of defaultSeedData) {
      await this.prisma.modelConfig.create({
        data: item,
      });
    }

    this.logger.log('Default ModelConfig records seeded');
  }

  async listConfigs(): Promise<ModelConfig[]> {
    const configs = await this.prisma.modelConfig.findMany({
      orderBy: { agentType: 'asc' },
    });

    return configs.map((cfg) => {
      if (cfg.apiKeyEnc) {
        cfg.apiKeyEnc = '********'; // Mask key from response
      }
      return cfg;
    });
  }

  async updateConfig(
    agentType: AgentType,
    dto: {
      provider: Provider;
      modelName: string;
      endpoint?: string;
      apiKey?: string;
    },
  ): Promise<ModelConfig> {
    const existing = await this.prisma.modelConfig.findFirst({
      where: { agentType, isDefault: true },
    });

    const apiKeyEnc = dto.apiKey ? encrypt(dto.apiKey) : null;

    let result: ModelConfig;
    if (existing) {
      result = await this.prisma.modelConfig.update({
        where: { id: existing.id },
        data: {
          provider: dto.provider,
          modelName: dto.modelName,
          endpoint: dto.endpoint || null,
          apiKeyEnc: apiKeyEnc ?? existing.apiKeyEnc, // Retain current key if not updated
          isActive: true,
        },
      });
    } else {
      result = await this.prisma.modelConfig.create({
        data: {
          agentType,
          provider: dto.provider,
          modelName: dto.modelName,
          endpoint: dto.endpoint || null,
          apiKeyEnc,
          isActive: true,
          isDefault: true,
        },
      });
    }

    if (result.apiKeyEnc) {
      result.apiKeyEnc = '********'; // Redact key for returned response
    }
    return result;
  }

  async testConnection(dto: {
    provider: Provider;
    modelName: string;
    endpoint?: string;
    apiKey?: string;
  }): Promise<{ online: boolean; latencyMs: number; error?: string }> {
    const startTime = Date.now();

    if (dto.provider === Provider.OLLAMA) {
      try {
        // Resolve target endpoint (defaults to process.env.OLLAMA_API_URL / 12005)
        const targetUrl = dto.endpoint || process.env.OLLAMA_API_URL || 'http://localhost:12005';
        
        // Brief request check
        await firstValueFrom(
          this.httpService.get(`${targetUrl}/api/tags`, { timeout: 3000 }),
        );

        return {
          online: true,
          latencyMs: Date.now() - startTime,
        };
      } catch (err: any) {
        return {
          online: false,
          latencyMs: Date.now() - startTime,
          error: `Ollama connection failed at ${dto.endpoint || 'default'}: ${err.message}`,
        };
      }
    } else if (dto.provider === Provider.ANTHROPIC) {
      if (!dto.apiKey) {
        return { online: false, latencyMs: 0, error: 'API key is required to test Anthropic.' };
      }
      try {
        await firstValueFrom(
          this.httpService.get('https://api.anthropic.com/v1/models', {
            timeout: 5000,
            headers: { 'x-api-key': dto.apiKey, 'anthropic-version': '2023-06-01' },
          }),
        );
        return { online: true, latencyMs: Date.now() - startTime };
      } catch (err: any) {
        const msg = err.response?.data?.error?.message ?? err.message;
        return { online: false, latencyMs: Date.now() - startTime, error: msg };
      }
    }

    return { online: false, latencyMs: 0, error: 'Unknown provider' };
  }

  async getAgentLogs(agentType: string, limit = 50): Promise<{ logs: string[] }> {
    const records = await this.prisma.activityLog.findMany({
      where: {
        action: 'agent.prompt_execution',
        entityId: agentType,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const formattedLogs = records.map((record) => {
      const details = (record.details as any) || {};
      const timestamp = record.createdAt.toISOString();
      const provider = details.provider || 'UNKNOWN';
      const model = details.model || 'UNKNOWN';
      const duration = details.durationMs ? `${details.durationMs}ms` : 'N/A';

      return `[${timestamp}] [Provider: ${provider}] [Model: ${model}] [Latency: ${duration}]\nPROMPT:\n${details.prompt}\n\nRESPONSE:\n${details.response}\n--------------------------------------------------\n`;
    });

    return { logs: formattedLogs };
  }

  async executePrompt(
    agentType: AgentType,
    prompt: string,
    options?: { temperature?: number; max_tokens?: number },
    modelOverride?: string,
  ): Promise<{ text: string; model: string }> {
    const startTime = Date.now();

    // If a Gemini model override is provided, use Gemini directly with fallback
    if (modelOverride) {
      const result = await this.gemini.generateContent(prompt, modelOverride, {
        temperature: options?.temperature,
        maxTokens: options?.max_tokens,
      });

      const durationMs = Date.now() - startTime;

      try {
        await this.prisma.activityLog.create({
          data: {
            action: 'agent.prompt_execution',
            entityType: 'agent',
            entityId: agentType,
            details: {
              prompt,
              response: result.text,
              durationMs,
              provider: 'GOOGLE',
              model: result.modelUsed,
            },
          },
        });
      } catch (logErr: any) {
        this.logger.error(`Failed to write prompt activity audit: ${logErr.message}`);
      }

      return { text: result.text, model: result.modelUsed };
    }

    let config = await this.prisma.modelConfig.findFirst({
      where: { agentType, isDefault: true, isActive: true },
    });

    if (!config) {
      config = {
        id: 'fallback-id',
        agentType,
        provider: Provider.OLLAMA,
        modelName: 'qwen2.5:7b',
        endpoint: null,
        apiKeyEnc: null,
        isActive: true,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    let responseText = '';
    let executionModel = config.modelName;

    if (config.provider === Provider.GOOGLE) {
      const result = await this.gemini.generateContent(prompt, config.modelName, {
        temperature: options?.temperature,
        maxTokens: options?.max_tokens,
      });
      responseText = result.text;
      executionModel = result.modelUsed;
    } else if (config.provider === Provider.OLLAMA) {
      const ollamaResult = await this.ollama.generate(prompt, config.modelName, {
        temperature: options?.temperature,
        max_tokens: options?.max_tokens,
      });
      responseText = ollamaResult.response;
    } else if (config.provider === Provider.ANTHROPIC) {
      const localResult = await this.ollama.generate(prompt, 'qwen2.5:7b', {
        temperature: options?.temperature,
        max_tokens: options?.max_tokens,
      });
      responseText = localResult.response;
    }

    const durationMs = Date.now() - startTime;

    try {
      await this.prisma.activityLog.create({
        data: {
          action: 'agent.prompt_execution',
          entityType: 'agent',
          entityId: agentType,
          details: {
            prompt,
            response: responseText,
            durationMs,
            provider: config.provider,
            model: config.modelName,
          },
        },
      });
    } catch (logErr: any) {
      this.logger.error(`Failed to write prompt activity audit: ${logErr.message}`);
    }

    return {
      text: responseText,
      model: executionModel,
    };
  }
}
