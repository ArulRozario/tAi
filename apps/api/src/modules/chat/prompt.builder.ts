import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface PromptContext {
  systemPrompt: string;
  userPrompt: string;
  systemInstruction?: string;
}

@Injectable()
export class PromptBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async build(
    context: string,
    prompt: string,
    options: {
      entityId?: string;
      segmentId?: string;
      currentContent?: string;
      mode?: string;
    }
  ): Promise<PromptContext> {
    switch (context) {
      case 'styleGuide':
        return this.buildStyleGuidePrompt(prompt, options);
      case 'segment':
        return this.buildSegmentPrompt(prompt, options);
      case 'pageReview':
        return this.buildPageReviewPrompt(prompt, options);
      case 'general':
      default:
        return this.buildGeneralPrompt(prompt);
    }
  }

  private async buildStyleGuidePrompt(
    prompt: string,
    options: { entityId?: string; currentContent?: string; mode?: string }
  ): Promise<PromptContext> {
    let dbContent: string | undefined;
    if (options.entityId) {
      const styleGuide = await this.prisma.styleGuide.findUnique({
        where: { id: options.entityId },
        include: {
          versions: { orderBy: { version: 'desc' }, take: 1 },
        },
      });
      dbContent = styleGuide?.versions[0]?.content;
    }

    const promptPath = [
      join(__dirname, '..', '..', '..', 'src', 'modules', 'style-guides', 'style-guide-chat-prompt.md'),
      join(__dirname, '..', '..', '..', 'modules', 'style-guides', 'style-guide-chat-prompt.md'),
      join(process.cwd(), 'apps', 'api', 'src', 'modules', 'style-guides', 'style-guide-chat-prompt.md'),
    ].find((p) => {
      try {
        return require('fs').existsSync(p);
      } catch {
        return false;
      }
    });

    if (!promptPath) {
      throw new Error('style-guide-chat-prompt.md not found in expected locations');
    }

    const promptTemplate = readFileSync(promptPath, 'utf-8');

    const currentContentBlock = options.currentContent?.trim()
      ? options.currentContent.trim()
      : dbContent?.trim()
      ? dbContent.trim()
      : '# New Style Guide\nEnglish → [Target Language] ([tradition/style])\n\n## Purpose\nDescribe the purpose of this style guide.\n\n## Core Rules\n1. Rule one\n2. Rule two\n\n## Terminology — Non-Negotiable Terms\n\nThese terms are fixed.\n\n| Source | Target | Incorrect (never use) |\n|--------|--------|----------------------|\n| Example | Example | — |\n\n## Register\n- Formal register throughout\n\n## Sentence Structure\n- Preserve source sentence weight\n\n## Proper Nouns\nUse established transliterations:\n- Example → Example\n\n## Common Pitfalls\n- Using informal register — maintain formal style\n\n## Examples\n\nSource: Example sentence.\nTarget: Translated sentence.';

    const planModeInstruction =
      options.mode === 'plan'
        ? 'You are in PLAN MODE. Discuss the proposed changes with the user. Do NOT output the full document yet — explain what you would change and wait for approval.'
        : 'You are in DIRECT MODE. Output the COMPLETE updated style guide document with the requested changes applied. Start directly with the `# ` title line.';

    const fullUserPrompt = promptTemplate
      .replace('{{currentContentBlock}}', () => currentContentBlock)
      .replace('{{planModeInstruction}}', () => planModeInstruction)
      .replace('{{userRequest}}', () => prompt);

    return {
      systemPrompt: '',
      userPrompt: fullUserPrompt,
      systemInstruction:
        'You are a strict and precise style guide editor. In DIRECT mode, your ONLY output must be the raw markdown document starting with `# `. You must strictly follow the 8-section structure defined in the prompt template. DO NOT include any conversational preamble or postamble. DO NOT wrap your output in markdown code fences (```). In PLAN mode, discuss the changes conversationally.',
    };
  }

  private async buildSegmentPrompt(
    prompt: string,
    options: { entityId?: string; segmentId?: string }
  ): Promise<PromptContext> {
    if (!options.entityId || !options.segmentId) {
      return {
        systemPrompt: 'You are a translation assistant.',
        userPrompt: prompt,
      };
    }

    const page = await this.prisma.page.findUnique({
      where: { id: options.entityId },
      include: {
        project: {
          include: {
            styleGuide: { include: { currentVersion: true } },
          },
        },
      },
    });

    if (!page) {
      return {
        systemPrompt: 'You are a translation assistant.',
        userPrompt: prompt,
      };
    }

    const originalHtml = page.originalHtml || '';
    const translatedHtml = page.translatedHtml || '';
    const sourceText = this.extractSegmentText(originalHtml, options.segmentId);
    const currentTranslation = this.extractSegmentText(translatedHtml, options.segmentId);

    const glossaryTerms = await this.prisma.glossaryTerm.findMany({
      where: { styleGuideId: page.project.styleGuideId },
      orderBy: { sourceTerm: 'asc' },
      take: 50,
    });

    const styleGuide = page.project.styleGuide;
    const styleGuideContent = styleGuide?.currentVersion?.content || '';
    const styleGuideName = styleGuide?.name || 'Project Style Guide';

    const systemPrompt = `You are a precise theological and scripture translation assistant.
Translate from ${page.project.sourceLang} to ${page.project.targetLang}.

You must strictly follow the style guide: "${styleGuideName}"

Style Guide Content:
"""
${styleGuideContent}
"""

Glossary Terms:
${glossaryTerms.map((t) => `- ${t.sourceTerm} -> ${t.targetTerm}${t.context ? ` (${t.context})` : ''}`).join('\n')}

Instructions:
- Only output the translated text for the given segment.
- Do not add explanations, markdown, or extra formatting.
- Preserve any inline HTML tags (like <b>, <i>, <sup>) if they appear in the original.
- Follow the style guide "${styleGuideName}" and use glossary terms precisely.
`;

    const userPrompt = `Source text: """${sourceText}"""
Current translation: """${currentTranslation || '[none]'}"""

User instruction: ${prompt}

Provide only the improved translation for this segment.`;

    return { systemPrompt, userPrompt };
  }

  private async buildPageReviewPrompt(
    prompt: string,
    options: { entityId?: string }
  ): Promise<PromptContext> {
    const baseInstruction =
      'You are tAI, a powerful theological and scripture translation assistant. Be precise, highly contextual, and prioritize theological accuracy.\n';

    if (!options.entityId) {
      return {
        systemPrompt: baseInstruction,
        userPrompt: prompt,
      };
    }

    const page = await this.prisma.page.findUnique({
      where: { id: options.entityId },
      include: { errors: true },
    });

    if (!page) {
      return {
        systemPrompt: baseInstruction,
        userPrompt: prompt,
      };
    }

    let textContext = `Context: You are reviewing Page Number ${page.pageNumber}.\nOriginal HTML:\n"""\n${page.originalHtml || ''}\n"""\nTranslated HTML:\n"""\n${page.translatedHtml || ''}\n"""\n`;

    const openErrors = page.errors.filter((e) => e.status === 'OPEN');
    if (openErrors.length > 0) {
      textContext += `Open Errors:\n${openErrors.map((e) => `- [${e.category}] "${e.currentText}" -> "${e.suggestedText}" (${e.issueDescription})`).join('\n')}\n`;
    }

    return {
      systemPrompt: `${baseInstruction}\n${textContext}`,
      userPrompt: prompt,
    };
  }

  private buildGeneralPrompt(prompt: string): PromptContext {
    return {
      systemPrompt:
        'You are tAI, a powerful theological and scripture translation assistant. Be precise, highly contextual, and prioritize theological accuracy.',
      userPrompt: prompt,
    };
  }

  private extractSegmentText(html: string, segmentId: string): string | null {
    if (!html) return null;
    const escapedId = segmentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      `<span\\b[^>]*\\bid=["']${escapedId}["'][^>]*>([\\s\\S]*?)<\\/span>`,
      'i',
    );
    const match = html.match(pattern);
    return match ? match[1] : null;
  }
}
