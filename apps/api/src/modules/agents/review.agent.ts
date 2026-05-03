import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { PrismaService } from '../prisma/prisma.service';
import { PageStatus } from '@prisma/client';

interface QualityScore {
  totalScore: number;
  breakdown: {
    terminology: number;
    grammar: number;
    meaning: number;
    style: number;
  };
  errors: {
    type: string;
    location: string;
    issue: string;
    suggestion: string;
  }[];
  recommendation: 'approve' | 'human_review' | 'retry';
}

@Injectable()
export class ReviewAgent {
  private readonly logger = new Logger(ReviewAgent.name);

  private readonly reviewPrompt = `You are a Tamil Bible translation quality reviewer. Your task is to evaluate translations for accuracy, quality, and adherence to Thiruviviliam style.

## Evaluation Criteria

### 1. Terminology Accuracy (0-30 points)
- Correct use of Thiruviviliam terms
- Consistent terminology throughout
- Proper transliteration of proper nouns

### 2. Grammar & Syntax (0-25 points)
- Correct Tamil grammar
- Proper sentence structure
- Appropriate use of Tamil inflections

### 3. Meaning Preservation (0-25 points)
- Accurate representation of original meaning
- No omissions or additions
- Correct handling of idioms and metaphors

### 4. Style & Readability (0-20 points)
- Appropriate formal tone
- Natural Tamil phrasing
- Readable for modern Tamil readers

## Output Format

Provide a JSON response with this structure:
{
  "totalScore": <0-100>,
  "breakdown": {
    "terminology": <0-30>,
    "grammar": <0-25>,
    "meaning": <0-25>,
    "style": <0-20>
  },
  "errors": [
    {
      "type": "terminology|grammar|meaning|style",
      "location": "text snippet",
      "issue": "description of issue",
      "suggestion": "correction suggestion"
    }
  ],
  "recommendation": "approve|human_review|retry"
}`;

  constructor(
    private ollama: OllamaService,
    private prisma: PrismaService,
  ) {}

  async reviewPage(pageId: string): Promise<QualityScore> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!page || !page.translatedText) {
      throw new Error(`Page not found or no translation: ${pageId}`);
    }

    try {
      // Update status
      await this.prisma.page.update({
        where: { id: pageId },
        data: { status: PageStatus.REVIEWING },
      });

      const prompt = `${this.reviewPrompt}

## Original Text:
${page.originalText}

## Translated Text:
${page.translatedText}

Please evaluate and respond with JSON only.`;

      const response = await this.ollama.generate(
        prompt,
        'phi4-mini',
        {
          temperature: 0.1,
          top_p: 0.95,
        },
      );

      // Parse the JSON response
      const result = this.parseQualityResponse(response.response);

      // Save review data
      await this.prisma.page.update({
        where: { id: pageId },
        data: {
          qualityScore: result.totalScore,
          reviewData: {
            ...result,
            model: response.model,
          },
          // Route to human review regardless (policy: every page gets human review)
          status: PageStatus.HUMAN_REVIEW,
        },
      });

      this.logger.log(`Page ${pageId} reviewed, score: ${result.totalScore}`);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      await this.prisma.page.update({
        where: { id: pageId },
        data: {
          status: PageStatus.ERROR,
          errorMessage: `Review failed: ${errorMessage}`,
        },
      });

      throw new Error(errorMessage);
    }
  }

  private parseQualityResponse(response: string): QualityScore {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        totalScore: parsed.totalScore ?? 0,
        breakdown: {
          terminology: parsed.breakdown?.terminology ?? 0,
          grammar: parsed.breakdown?.grammar ?? 0,
          meaning: parsed.breakdown?.meaning ?? 0,
          style: parsed.breakdown?.style ?? 0,
        },
        errors: parsed.errors ?? [],
        recommendation: parsed.recommendation ?? 'human_review',
      };
    } catch (error) {
      this.logger.error(`Failed to parse quality response: ${(error as Error).message}`);
      return {
        totalScore: 50,
        breakdown: { terminology: 10, grammar: 10, meaning: 15, style: 15 },
        errors: [],
        recommendation: 'human_review',
      };
    }
  }
}