import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { PrismaService } from '../prisma/prisma.service';
import { PageStatus } from '@prisma/client';

@Injectable()
export class TranslationAgent {
  private readonly logger = new Logger(TranslationAgent.name);

  private readonly systemPrompt = `You are a Thiruviviliam (திருவிவிலியம்) Tamil Bible translator. Your task is to translate English text into Tamil using the established terminology and style of the Tamil Bible (Thiruviviliam).

## Guidelines

1. **Terminology**: Use Thiruviviliam terminology consistently:
   - God = தேவன்
   - Lord = ஆண்டவர்
   - Jesus Christ = இயேசு கிறிஸ்து
   - Holy Spirit = பரிசுத்த ஆவி
   - faith = விசுவாசம்
   - believe = விசுவாசி
   - church = தேவாலயம்
   - prayer = வழிபாடு
   - Scripture = திருவசனம்

2. **Style**:
   - Formal, dignified language appropriate for religious text
   - Use classical Tamil forms where appropriate
   - Maintain readability for modern Tamil readers
   - Avoid colloquial expressions

3. **Structure**:
   - Preserve paragraph structure
   - Keep proper nouns in transliterated form

4. **Accuracy**:
   - Preserve original meaning
   - Don't add interpretive commentary

## Output Format

Provide ONLY the translated Tamil text. No explanations, no English, no notes.`;

  constructor(
    private ollama: OllamaService,
    private prisma: PrismaService,
  ) {}

  async translatePage(pageId: string): Promise<string> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    if (!page.originalText) {
      throw new Error(`No original text to translate for page: ${pageId}`);
    }

    // Get applicable rules
    const rules = await this.getApplicableRules(page.projectId);

    // Build prompt with rules
    const fullPrompt = this.buildPrompt(page.originalText, rules);

    try {
      // Update status to translating
      await this.prisma.page.update({
        where: { id: pageId },
        data: { status: PageStatus.TRANSLATING },
      });

      // Call Ollama
      const response = await this.ollama.generate(
        fullPrompt,
        'qwen2.5:7b',
        {
          temperature: 0.3,
          top_p: 0.9,
          top_k: 40,
        },
      );

      const translatedText = response.response.trim();

      // Save translation
      await this.prisma.page.update({
        where: { id: pageId },
        data: {
          translatedText,
          status: PageStatus.TRANSLATED,
          translationData: {
            model: response.model,
            duration: response.evalDuration,
          },
        },
      });

      this.logger.log(`Page ${pageId} translated successfully`);
      return translatedText;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      // Update status to error
      await this.prisma.page.update({
        where: { id: pageId },
        data: {
          status: PageStatus.ERROR,
          errorMessage,
        },
      });

      throw new Error(errorMessage);
    }
  }

  private async getApplicableRules(projectId: string) {
    // Get global active rules
    const globalRules = await this.prisma.rule.findMany({
      where: {
        isGlobal: true,
        isActive: true,
        category: 'TRANSLATION',
      },
      orderBy: { priority: 'desc' },
    });

    // Get project-specific overrides
    const projectOverrides = await this.prisma.ruleOverride.findMany({
      where: {
        projectId,
        isActive: true,
      },
      include: { rule: true },
    });

    return { globalRules, projectOverrides };
  }

  private buildPrompt(originalText: string, rules: { globalRules: any[]; projectOverrides: any[] }): string {
    let prompt = this.systemPrompt + '\n\n';

    // Add global rules
    for (const rule of rules.globalRules) {
      prompt += `## ${rule.name}\n${rule.content}\n\n`;
    }

    // Add project overrides
    for (const override of rules.projectOverrides) {
      if (override.overrideContent) {
        prompt += `## Project Override: ${override.rule.name}\n${override.overrideContent}\n\n`;
      }
    }

    prompt += `## Translate to Tamil:\n${originalText}`;
    return prompt;
  }
}