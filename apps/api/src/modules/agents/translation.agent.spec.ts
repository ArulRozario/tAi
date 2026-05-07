import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TranslationAgent } from './translation.agent';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from './memory.service';
import { GeminiService } from './gemini.service';
import { MinIOService } from '../files/minio.service';

describe('TranslationAgent', () => {
  let agent: TranslationAgent;

  const mockPrisma = {
    project: {
      findUnique: vi.fn(),
    },
    glossaryTerm: {
      findMany: vi.fn(),
    },
    page: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockMemory = {
    retrieve: vi.fn(),
  };

  const mockGemini = {
    translatePageVisual: vi.fn(),
  };

  const mockMinio = {
    downloadFile: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationAgent,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MemoryService, useValue: mockMemory },
        { provide: GeminiService, useValue: mockGemini },
        { provide: MinIOService, useValue: mockMinio },
      ],
    }).compile();

    agent = module.get<TranslationAgent>(TranslationAgent);
  });

  it('should be defined', () => {
    expect(agent).toBeDefined();
  });

  describe('translateBatch', () => {
    it('should process pages sequentially and handle sliding window boundary metadata', async () => {
      // Mock Project findUnique
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        name: 'Gospel of John',
        sourceLang: 'English',
        targetLang: 'Tamil',
        genreId: 'theology',
        genre: {
          currentVersion: {
            content: 'Historic classical formal register rules.',
          },
        },
      });

      // Mock Glossary terms findMany
      mockPrisma.glossaryTerm.findMany.mockResolvedValue([
        { sourceTerm: 'Word', targetTerm: 'வார்த்தை', context: 'John 1:1' },
      ]);

      // Mock Page list findMany
      mockPrisma.page.findMany.mockResolvedValue([
        {
          id: 'page-1',
          pageNumber: 1,
          originalHtml: '<p>In the beginning was the Word</p>',
          translationMetadata: {},
        },
        {
          id: 'page-2',
          pageNumber: 2,
          originalHtml: '<p>The light shines in the darkness</p>',
          translationMetadata: {},
        },
      ]);

      // Mock MinIO download file (triggers visual fallback safely)
      mockMinio.downloadFile.mockRejectedValue(new Error('MinIO offline mock'));

      // Mock Gemini translation response
      mockGemini.translatePageVisual
        .mockResolvedValueOnce({
          originalHtml: '<p>In the beginning was the Word</p>',
          translatedHtml: '<p>ஆதியிலே வார்த்தை இருந்தது</p>',
          boundaryMetadata: {
            borrowedTextFromNextPage: 'and the Word was with God',
          },
          isNewChapter: true,
          chapterNumber: 1,
        })
        .mockResolvedValueOnce({
          originalHtml: '<p>The light shines in the darkness</p>',
          translatedHtml: '<p>அந்த வெளிச்சம் இருளிலே பிரகாசிக்கிறது</p>',
          boundaryMetadata: {},
          isNewChapter: false,
        });

      const results = await agent.translateBatch('project-1', ['page-1', 'page-2']);

      expect(results).toHaveLength(2);
      expect(results[0].translatedHtml).toContain('ஆதியிலே வார்த்தை இருந்தது');
      expect(results[0].borrowedText).toBe('and the Word was with God');
      expect(results[1].translatedHtml).toContain('இருளிலே பிரகாசிக்கிறது');

      // Verify page.update was called on second page to store borrowed text immediately
      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: 'page-2' },
        data: {
          translationMetadata: {
            borrowedTextFromNextPage: 'and the Word was with God',
          },
        },
      });
    });
  });
});
