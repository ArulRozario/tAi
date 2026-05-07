import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModelsService } from '../models/models.service';
import { AgentType, ErrorSeverity, ErrorCategory } from '@prisma/client';

export interface ReviewInput {
  id: string;
  source: string;
  translation: string;
}

export interface ReviewErrorOutput {
  severity: ErrorSeverity;
  category: ErrorCategory;
  location: string;
  currentText: string;
  suggestedText: string;
  issueDescription: string;
  reference?: string;
  aiNote?: string;
}

export interface SentenceReviewOutput {
  sentenceId: string;
  errors: ReviewErrorOutput[];
}

@Injectable()
export class ReviewAgent {
  private readonly logger = new Logger(ReviewAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly modelsService: ModelsService,
  ) {}

  /**
   * Main entrypoint to review a batch of sentence translations.
   */
  async reviewBatch(
    projectId: string,
    sentences: ReviewInput[],
  ): Promise<SentenceReviewOutput[]> {
    this.logger.log(`Evaluating translation quality for ${sentences.length} sentences on project ${projectId}`);

    // 1. Fetch project details & style guide reference
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        genre: {
          include: {
            currentVersion: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const sourceLang = project.sourceLang;
    const targetLang = project.targetLang;
    const styleGuide = project.genre.currentVersion?.content?.slice(0, 2000) || 'Standard formal tone guide.';

    // 2. Fetch top 50 glossary terms for this genre
    const glossaryTerms = await this.prisma.glossaryTerm.findMany({
      where: { genreId: project.genreId },
      take: 50,
      orderBy: { sourceTerm: 'asc' },
    });

    const glossaryBlock = glossaryTerms
      .map((term) => `${term.sourceTerm} → ${term.targetTerm}`)
      .join('\n');

    // 3. Construct System Prompt
    const systemPrompt = `You are a professional translation quality reviewer.
Evaluate the ${targetLang} translations of the provided ${sourceLang} source sentences.
Apply the terminology and style rules from the style guide when assessing quality.

## Style Guide Reference
${styleGuide}

## Glossary Reference
${glossaryBlock || 'No glossary terms defined.'}

## Output Format (strict JSON array — one entry per input sentence)
[
  {
    "sentenceId": "UUID",
    "errors": [
      {
        "severity": "CRITICAL|HIGH|MEDIUM|LOW",
        "category": "TERMINOLOGY|ACCURACY|FLUENCY|STYLE|GRAMMAR",
        "location": "<text snippet where error occurs>",
        "currentText": "<what was translated>",
        "suggestedText": "<what it should be>",
        "issueDescription": "<why it is wrong>",
        "reference": "<glossary term or style guide rule if applicable>",
        "aiNote": "<model's explanation of why this error occurred>"
      }
    ]
  }
]
Output an empty errors array for sentences with no errors. Do not omit any sentence from the output.`;

    // 4. Construct User Prompt
    const userPrompt = `Review the following ${sourceLang} → ${targetLang} sentence translations:

\`\`\`json
${JSON.stringify(
  sentences.map((s) => ({ id: s.id, source: s.source, translation: s.translation })),
  null,
  2,
)}
\`\`\``;

    // 5. Execute Prompt using ModelsService
    const response = await this.modelsService.executePrompt(AgentType.REVIEW, `${systemPrompt}\n\n${userPrompt}`, {
      temperature: 0.1,
      max_tokens: 4096,
    });

    // 6. Safely Parse and Validate JSON
    try {
      const textResponse = response.text.trim();
      const jsonMatch = textResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);

      if (!jsonMatch) {
        throw new Error(`Failed to extract JSON array from review response. Raw response: ${textResponse}`);
      }

      const parsed = JSON.parse(jsonMatch[0]) as any[];

      // Map and robustly parse error severity/category values to match Prisma enums perfectly
      const outputs: SentenceReviewOutput[] = parsed.map((item) => {
        if (!item.sentenceId) {
          throw new Error('Review response item missing "sentenceId"');
        }

        const rawErrors = (item.errors || []) as any[];

        const mappedErrors: ReviewErrorOutput[] = rawErrors.map((err) => {
          // Normalize ErrorSeverity
          let severity: ErrorSeverity = ErrorSeverity.MEDIUM;
          const rawSeverity = String(err.severity).toUpperCase();
          if (rawSeverity === 'CRITICAL') severity = ErrorSeverity.CRITICAL;
          else if (rawSeverity === 'HIGH') severity = ErrorSeverity.HIGH;
          else if (rawSeverity === 'MEDIUM') severity = ErrorSeverity.MEDIUM;
          else if (rawSeverity === 'LOW') severity = ErrorSeverity.LOW;

          // Normalize ErrorCategory
          let category: ErrorCategory = ErrorCategory.STYLE;
          const rawCategory = String(err.category).toUpperCase();
          if (rawCategory === 'TERMINOLOGY') category = ErrorCategory.TERMINOLOGY;
          else if (rawCategory === 'STYLE') category = ErrorCategory.STYLE;
          else if (rawCategory === 'ACCURACY') category = ErrorCategory.ACCURACY;
          else if (rawCategory === 'FLUENCY') category = ErrorCategory.FLUENCY;
          else if (rawCategory === 'GRAMMAR') category = ErrorCategory.GRAMMAR;

          return {
            severity,
            category,
            location: err.location || 'entire sentence',
            currentText: err.currentText || '',
            suggestedText: err.suggestedText || '',
            issueDescription: err.issueDescription || 'Quality issue detected.',
            reference: err.reference || null,
            aiNote: err.aiNote || null,
          };
        });

        return {
          sentenceId: item.sentenceId,
          errors: mappedErrors,
        };
      });

      return outputs;
    } catch (parseErr) {
      this.logger.error(`Failed parsing review response: ${(parseErr as Error).message}`);
      throw parseErr;
    }
  }
}