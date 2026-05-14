import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { ModelRegistryService } from './model-registry.service';

export interface TranslationOutput {
  originalHtml: string;
  translatedHtml: string;
  boundaryMetadata?: {
    borrowedTextFromNextPage?: string;
  };
  isNewChapter?: boolean;
  chapterNumber?: number;
  incompleteSentenceAtEnd?: string;
}

function isQuotaError(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return (
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource exhausted') ||
    msg.includes('429') ||
    msg.includes('too many requests') ||
    msg.includes('exhausted')
  );
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly ai: GoogleGenAI;
  private readonly defaultModel = 'gemini-1.5-flash';

  constructor(private readonly registry: ModelRegistryService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not defined in environment variables.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates text content with automatic model fallback on quota errors.
   */
  async generateContent(
    prompt: string,
    preferredModel?: string,
    config?: { temperature?: number; maxTokens?: number; responseMimeType?: string },
  ): Promise<{ text: string; modelUsed: string }> {
    const chain = this.registry.getFallbackChain(preferredModel || this.defaultModel);

    for (const model of chain) {
      try {
        this.logger.debug(`Trying model ${model} for text generation...`);
        const response = await this.ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: config?.temperature ?? 0.3,
            maxOutputTokens: config?.maxTokens ?? 4096,
            responseMimeType: config?.responseMimeType ?? 'text/plain',
          },
        });

        const text = response.text;
        if (!text) {
          throw new Error('Gemini returned an empty text response.');
        }

        return { text, modelUsed: model };
      } catch (err) {
        if (isQuotaError(err as Error)) {
          this.registry.markExhausted(model);
          this.logger.warn(`Model ${model} quota exceeded, trying fallback...`);
        } else {
          this.logger.warn(`Model ${model} failed (${(err as Error).message}), trying fallback...`);
        }
        continue;
      }
    }

    throw new Error('All Gemini models exhausted. Please retry later.');
  }

  /**
   * Generates structured visual translation content with automatic model fallback.
   */
  async translatePageVisual(
    pageImageBase64: string,
    prompt: string,
    preferredModel?: string,
  ): Promise<TranslationOutput & { modelUsed: string }> {
    const chain = this.registry.getFallbackChain(preferredModel || this.defaultModel);

    for (const model of chain) {
      try {
        this.logger.debug(`Trying model ${model} for visual translation...`);
        const response = await this.ai.models.generateContent({
          model,
          contents: [
            prompt,
            {
              inlineData: {
                mimeType: 'image/webp',
                data: pageImageBase64,
              },
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                originalHtml: { type: Type.STRING },
                translatedHtml: { type: Type.STRING },
                boundaryMetadata: {
                  type: Type.OBJECT,
                  properties: {
                    borrowedTextFromNextPage: { type: Type.STRING },
                  },
                },
                isNewChapter: { type: Type.BOOLEAN },
                chapterNumber: { type: Type.INTEGER },
                incompleteSentenceAtEnd: { type: Type.STRING },
              },
              required: ['originalHtml', 'translatedHtml'],
            },
          },
        });

        const responseText = response.text;
        if (!responseText) {
          throw new Error('Gemini returned an empty text response.');
        }

        const parsed = JSON.parse(responseText) as TranslationOutput;
        return { ...parsed, modelUsed: model };
      } catch (err) {
        if (isQuotaError(err as Error)) {
          this.registry.markExhausted(model);
          this.logger.warn(`Model ${model} quota exceeded, trying fallback...`);
        } else {
          this.logger.warn(`Model ${model} failed (${(err as Error).message}), trying fallback...`);
        }
        continue;
      }
    }

    throw new Error('All Gemini models exhausted. Please retry later.');
  }

  /**
   * Lists available Gemini models from the registry.
   */
  async listModels() {
    return this.registry.getAllModels();
  }

  /**
   * Encodes a standard text embedding of 768 dimensions.
   */
  async getEmbedding768(text: string): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
        config: { outputDimensionality: 768 },
      });

      if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
        throw new Error('Gemini embedding response values are empty.');
      }

      return response.embeddings[0].values;
    } catch (error) {
      this.logger.error(`Gemini embedding creation failed: ${(error as Error).message}`);
      throw error;
    }
  }
}
