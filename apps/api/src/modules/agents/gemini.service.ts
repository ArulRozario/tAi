import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

export interface TranslationOutput {
  originalHtml: string;
  translatedHtml: string;
  boundaryMetadata?: {
    borrowedTextFromNextPage?: string;
  };
  isNewChapter?: boolean;
  chapterNumber?: number;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly ai: GoogleGenAI;
  private readonly defaultModel = 'gemini-1.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not defined in environment variables.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates structured text/image translation content.
   */
  async translatePageVisual(
    pageImageBase64: string,
    prompt: string,
  ): Promise<TranslationOutput> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.defaultModel,
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
              originalHtml: {
                type: Type.STRING,
                description: 'Visually transcribed original English text of the page, formatted in clean HTML-lite (using <b>, <i>, <u>, <sup> for verse numbers, and <p align="..."> for margins/headers).',
              },
              translatedHtml: {
                type: Type.STRING,
                description: 'Linguistically elegant visual Tamil translation of the page, styled as the historic Tamil Protestant Bible (Parisutha Vedagamam), maintaining matching HTML-lite tags for layout parity.',
              },
              boundaryMetadata: {
                type: Type.OBJECT,
                properties: {
                  borrowedTextFromNextPage: {
                    type: Type.STRING,
                    description: 'Any structural text fragment visually visible on the context page that belongs to a sentence split across the boundary, which was borrowed to complete a sentence translation on the current page.',
                  },
                },
              },
              isNewChapter: {
                type: Type.BOOLEAN,
                description: 'Flag set to true if the visual page layout explicitly starts a new Chapter (e.g. Chapter heading is present on this page).',
              },
              chapterNumber: {
                type: Type.INTEGER,
                description: 'The chapter number if this page starts a new Chapter.',
              },
            },
            required: ['originalHtml', 'translatedHtml'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini returned an empty text response.');
      }

      return JSON.parse(responseText) as TranslationOutput;
    } catch (error) {
      this.logger.error(`Gemini visual translation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Encodes a standard text embedding of 768 dimensions using text-embedding-004.
   */
  async getEmbedding768(text: string): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
        config: {
          outputDimensionality: 768,
        },
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
