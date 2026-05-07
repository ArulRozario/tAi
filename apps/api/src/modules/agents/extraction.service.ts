import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinIOService } from '../files/minio.service';
import { PageStatus, Priority, JobType, JobStatus, SentenceStatus } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);
  private readonly nlpUrl = process.env.NLP_SERVICE_URL || 'http://localhost:8001';

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinIOService,
  ) {}

  /**
   * PROCESS_DOCUMENT job: splits document into pages, uploads placeholder layouts,
   * creates PENDING pages, and enqueues EXTRACT_PAGE children.
   */
  async processDocument(jobId: string): Promise<void> {
    this.logger.log(`Executing PROCESS_DOCUMENT job: ${jobId}`);

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!job || !job.project) {
      this.logger.error(`PROCESS_DOCUMENT failed: Job ${jobId} or project not found`);
      return;
    }

    const { project } = job;

    // Set project status to PROCESSING
    await this.prisma.project.update({
      where: { id: project.id },
      data: { status: 'PROCESSING' },
    });

    // Idempotency: check if Page records already exist for this project
    const existingPages = await this.prisma.page.count({
      where: { projectId: project.id },
    });

    if (existingPages > 0) {
      this.logger.warn(`Pages already exist for project ${project.id}. Skipping split phase.`);
      return;
    }

    let fileContent = '';
    if (project.sourceFileId) {
      try {
        const buffer = await this.minio.downloadFile(project.sourceFileId);
        fileContent = buffer.toString('utf-8');
      } catch (err) {
        this.logger.warn(`Could not download source file from MinIO: ${(err as Error).message}. Using default mock pages.`);
      }
    }

    // High-fidelity fallback simulated pages
    const mockPages = [
      {
        pageNumber: 1,
        text: `# Chapter 1\n\nIn the beginning God created the heavens and the earth.\nThe earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.\n\nAnd God said, "Let there be light," and there was light.`,
      },
      {
        pageNumber: 2,
        text: `God saw that the light was good, and he separated the light from the darkness.\nGod called the light "day," and the darkness he called "night."\n\nAnd there was evening, and there was morning—the first day.`,
      },
      {
        pageNumber: 3,
        text: `# Chapter 2\n\nThus the heavens and the earth were completed in all their vast array.\nBy the seventh day God had finished the work he had been doing; so on the seventh day he rested from all his work.\n\nThen God blessed the seventh day and made it holy, because on it he rested from all the work of creating that he had done.`,
      },
    ];

    const pagesToCreate = fileContent.trim()
      ? fileContent.split('\f').map((text, idx) => ({ pageNumber: idx + 1, text: text.trim() }))
      : mockPages;

    const totalPages = pagesToCreate.length;

    for (let i = 0; i < totalPages; i++) {
      const pageData = pagesToCreate[i];
      const pageNum = pageData.pageNumber;

      // 1. Upload mock page layout image
      const imageBuffer = Buffer.from('MOCK_PAGE_IMAGE');
      const objectKey = `projects/${project.id}/pages/${pageNum}.png`;
      await this.minio.uploadBuffer(imageBuffer, objectKey, 'image/png');

      // 2. Create Page record
      const page = await this.prisma.page.create({
        data: {
          projectId: project.id,
          pageNumber: pageNum,
          originalText: pageData.text,
          status: PageStatus.PENDING,
          priority: Priority.MEDIUM,
        },
      });

      // 3. Enqueue EXTRACT_PAGE child job
      await this.prisma.job.create({
        data: {
          type: JobType.EXTRACT_PAGE,
          status: JobStatus.QUEUED,
          projectId: project.id,
          pageId: page.id,
          parentJobId: jobId,
          payload: { pageId: page.id },
        },
      });

      // Update parent job progress
      const progress = Math.round(((i + 1) / totalPages) * 100);
      await this.prisma.job.update({
        where: { id: jobId },
        data: { progress },
      });
    }

    this.logger.log(`PROCESS_DOCUMENT job ${jobId} successfully completed and extraction jobs enqueued`);
  }

  /**
   * EXTRACT_PAGE job: parses page text, segments paragraphs into sentences (spaCy),
   * creates Sentence records, and checks if DETECT_CHAPTERS should be queued.
   */
  async extractPage(jobId: string): Promise<void> {
    this.logger.log(`Executing EXTRACT_PAGE job: ${jobId}`);

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { page: true },
    });

    if (!job || !job.page) {
      this.logger.error(`EXTRACT_PAGE failed: Job ${jobId} or page not found`);
      return;
    }

    const { page } = job;

    // Idempotency: if page is not PENDING, skip
    if (page.status !== PageStatus.PENDING) {
      this.logger.warn(`Page ${page.id} status is already ${page.status}. Skipping extraction.`);
      return;
    }

    await this.prisma.page.update({
      where: { id: page.id },
      data: { status: PageStatus.EXTRACTING },
    });

    const pageText = page.originalText || '';

    // Segment paragraphs by splitting on structural Markdown boundaries
    const paragraphs = pageText.split('\n\n').map(p => p.trim()).filter(Boolean);
    let sentenceCounter = 1;
    let finalSourceMarkdown = '';

    for (const paragraph of paragraphs) {
      let sentences: string[] = [];

      // Call spaCy sidecar segmenter
      try {
        const response = await axios.post(`${this.nlpUrl}/segment`, { text: paragraph }, { timeout: 5000 });
        sentences = response.data.sentences || [];
      } catch (err) {
        this.logger.warn(`spaCy sidecar segmentation failed: ${(err as Error).message}. Falling back to regex split.`);
        // Fallback robust sentence splitter regex
        sentences = paragraph
          .split(/(?<=[.!?])\s+(?=[A-Z"])/)
          .map(s => s.trim())
          .filter(Boolean);
      }

      if (sentences.length === 0) {
        sentences = [paragraph];
      }

      let paragraphMarkdown = paragraph;

      for (const sentText of sentences) {
        const sentenceNum = sentenceCounter++;

        // Create Sentence record
        await this.prisma.sentence.create({
          data: {
            pageId: page.id,
            sentenceNumber: sentenceNum,
            originalText: sentText,
            status: SentenceStatus.PENDING,
          },
        });

        // Insert placeholder into page markdown
        // Replace exact sentence text with placeholder {{SENTENCE_X}}
        paragraphMarkdown = paragraphMarkdown.replace(sentText, `{{SENTENCE_${sentenceNum}}}`);
      }

      finalSourceMarkdown += paragraphMarkdown + '\n\n';
    }

    // Save final skeleton markdown & update page status
    await this.prisma.page.update({
      where: { id: page.id },
      data: {
        sourceMarkdown: finalSourceMarkdown.trim(),
        status: PageStatus.EXTRACTED,
      },
    });

    this.logger.log(`EXTRACT_PAGE completed successfully for page ${page.id}`);

    // Check if all EXTRACT_PAGE sibling jobs for this project are finished
    const parentJobId = job.parentJobId;
    if (parentJobId) {
      const activeSiblings = await this.prisma.job.count({
        where: {
          parentJobId,
          type: JobType.EXTRACT_PAGE,
          status: { in: [JobStatus.QUEUED, JobStatus.RUNNING] },
          id: { not: jobId }, // exclude self
        },
      });

      if (activeSiblings === 0) {
        this.logger.log(`All sibling pages extracted. Enqueuing DETECT_CHAPTERS for project ${page.projectId}`);
        await this.prisma.job.create({
          data: {
            type: JobType.DETECT_CHAPTERS,
            status: JobStatus.QUEUED,
            projectId: page.projectId,
            payload: { projectId: page.projectId },
          },
        });
      }
    }
  }

  /**
   * DETECT_CHAPTERS job: sentence boundary stitching, chapter boundary matching,
   * and token-budget batch planning → enqueues TRANSLATE_BATCH jobs.
   */
  async detectChapters(jobId: string): Promise<void> {
    this.logger.log(`Executing DETECT_CHAPTERS job: ${jobId}`);

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || !job.projectId) {
      this.logger.error(`DETECT_CHAPTERS failed: Job or project references not found`);
      return;
    }

    const projectId = job.projectId;

    // Idempotency: delete old chapters and unlink pages
    await this.prisma.chapter.deleteMany({ where: { projectId } });
    await this.prisma.page.updateMany({
      where: { projectId },
      data: { chapterId: null },
    });

    // 1. Load all pages in order with sentences
    const pages = await this.prisma.page.findMany({
      where: { projectId },
      orderBy: { pageNumber: 'asc' },
      include: {
        sentences: {
          orderBy: { sentenceNumber: 'asc' },
        },
      },
    });

    // 2. Cross-Page Sentence boundary stitching
    for (let i = 0; i < pages.length - 1; i++) {
      const currentPage = pages[i];
      const nextPage = pages[i + 1];

      if (currentPage.sentences.length === 0 || nextPage.sentences.length === 0) {
        continue;
      }

      const s1 = currentPage.sentences[currentPage.sentences.length - 1];
      const s2 = nextPage.sentences[0];

      // If last sentence of page N has no punctuation, and first sentence of page N+1 starts with lowercase or conjunction
      const hasNoPunctuation = !/[.!?:;]/.test(s1.originalText.slice(-1));
      const startsWithLowercaseOrConjunction = /^[a-z]|^and\b|^or\b|^but\b|^for\b|^with\b|^by\b|^to\b/i.test(s2.originalText);

      if (hasNoPunctuation && startsWithLowercaseOrConjunction) {
        this.logger.log(`Stitching cross-page boundary sentences between Page ${currentPage.pageNumber} and Page ${nextPage.pageNumber}`);

        // Update s1
        const mergedText = `${s1.originalText} ${s2.originalText}`;
        await this.prisma.sentence.update({
          where: { id: s1.id },
          data: { originalText: mergedText },
        });
        s1.originalText = mergedText; // local sync

        // Delete s2
        await this.prisma.sentence.delete({ where: { id: s2.id } });

        // Renumber remaining sentences on Page N+1
        const remainingSentences = nextPage.sentences.slice(1);
        for (let idx = 0; idx < remainingSentences.length; idx++) {
          const sent = remainingSentences[idx];
          const newNum = idx + 1;
          await this.prisma.sentence.update({
            where: { id: sent.id },
            data: { sentenceNumber: newNum },
          });
          sent.sentenceNumber = newNum; // local sync
        }

        // Update Page N+1 sourceMarkdown skeleton
        if (nextPage.sourceMarkdown) {
          // Remove {{SENTENCE_1}} and shift remaining sentence placeholders down by 1
          let markdown = nextPage.sourceMarkdown.replace('{{SENTENCE_1}}', '');
          for (let idx = 0; idx < remainingSentences.length; idx++) {
            const oldPlaceholder = `{{SENTENCE_${idx + 2}}}`;
            const newPlaceholder = `{{SENTENCE_${idx + 1}}}`;
            markdown = markdown.replace(oldPlaceholder, newPlaceholder);
          }
          await this.prisma.page.update({
            where: { id: nextPage.id },
            data: { sourceMarkdown: markdown },
          });
          nextPage.sourceMarkdown = markdown; // local sync
        }

        // Adjust local next-page list
        nextPage.sentences = remainingSentences;
      }
    }

    // 3. Chapter Detection
    let activeChapterNum = 0;
    let activeChapterId: string | null = null;

    for (const page of pages) {
      const pageText = page.originalText || '';

      // Check if page starts with Chapter header
      const match = pageText.match(/^#+\s+(?:Chapter|அதிகாரம்)\s+(\d+)/i);
      if (match) {
        activeChapterNum = parseInt(match[1], 10);
        const chapter = await this.prisma.chapter.create({
          data: {
            projectId,
            number: activeChapterNum,
            title: `Chapter ${activeChapterNum}`,
          },
        });
        activeChapterId = chapter.id;
      }

      if (!activeChapterId && pages.length > 0) {
        // Fallback: Default Chapter 1 if none found
        activeChapterNum = 1;
        const chapter = await this.prisma.chapter.create({
          data: {
            projectId,
            number: activeChapterNum,
            title: 'Chapter 1',
          },
        });
        activeChapterId = chapter.id;
      }

      if (activeChapterId) {
        await this.prisma.page.update({
          where: { id: page.id },
          data: { chapterId: activeChapterId },
        });
        page.chapterId = activeChapterId; // local sync
      }
    }

    // 4. Token-budget translation batch planning
    const MAX_BATCH_TOKENS = 2000;
    let currentBatch: string[] = [];
    let currentBatchTokens = 0;

    for (const page of pages) {
      // Estimate token count = character count / 4
      const pageTextLength = page.sentences.reduce((sum, s) => sum + s.originalText.length, 0);
      const pageTokens = Math.ceil(pageTextLength / 4);

      if (currentBatchTokens + pageTokens > MAX_BATCH_TOKENS && currentBatch.length > 0) {
        // Create translation job for this batch
        await this.prisma.job.create({
          data: {
            type: JobType.TRANSLATE_BATCH,
            status: JobStatus.QUEUED,
            projectId,
            payload: { projectId, pageIds: currentBatch },
          },
        });

        currentBatch = [page.id];
        currentBatchTokens = pageTokens;
      } else {
        currentBatch.push(page.id);
        currentBatchTokens += pageTokens;
      }
    }

    if (currentBatch.length > 0) {
      await this.prisma.job.create({
        data: {
          type: JobType.TRANSLATE_BATCH,
          status: JobStatus.QUEUED,
          projectId,
          payload: { projectId, pageIds: currentBatch },
        },
      });
    }

    this.logger.log(`DETECT_CHAPTERS complete: chapter splitting and translation batch enqueuing finished.`);
  }
}
