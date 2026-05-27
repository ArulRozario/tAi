import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModelsService } from '../models/models.service';
import { AgentType, ErrorSeverity, ErrorCategory } from '@prisma/client';

export interface ReviewErrorOutput {
  segmentId?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  location: string;
  currentText: string;
  suggestedText: string;
  issueDescription: string;
  reference?: string;
  aiNote?: string;
}

@Injectable()
export class ReviewAgent {
  private readonly logger = new Logger(ReviewAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly modelsService: ModelsService,
  ) {}

  /**
   * Main entrypoint to review a visual translated page (HTML-lite).
   */
  async reviewPage(
    projectId: string,
    pageId: string,
    originalHtml: string,
    translatedHtml: string,
    modelOverride?: string,
  ): Promise<{ errors: ReviewErrorOutput[]; modelUsed: string }> {
    this.logger.log(`Evaluating translation quality for page ${pageId} on project ${projectId}`);

    // 1. Fetch project details & style guide reference
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        styleGuide: {
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
    const styleGuide = project.styleGuide.currentVersion?.content || 'Standard theological formal register.';

    // 2. Construct System Prompt
    const systemPrompt = `You are a professional linguistic and technical quality assurance agent.
Your task is to review the ${targetLang} HTML-lite translation against the ${sourceLang} original text for a document page.

Apply the register guidelines, grammar, spelling, and style rules strictly.

## Quality Criteria
- Theology & Register: Verify tone matches Parisutha Vedagamam Tamil style.
- Formatting & Tags: Verify that HTML tags in translatedHtml match originalHtml perfectly (matching b, i, u, sup, and p paragraph markers). If tags are broken or misaligned, flag it.

## Style Guide Reference
${styleGuide}

## Output Format (strict JSON array of errors)
\`\`\`json
[
  {
    "severity": "CRITICAL|HIGH|MEDIUM|LOW",
    "category": "TERMINOLOGY|ACCURACY|FLUENCY|STYLE|GRAMMAR",
    "location": "Identify the tag, verse number, or phrase location (e.g. 'Paragraph 2', 'Verse 3', '<b> tag')",
    "currentText": "The wrong translated segment",
    "suggestedText": "Your recommended correction",
    "issueDescription": "Detailed reason why it is flagged",
    "reference": "Reference to style guide rule if applicable",
    "aiNote": "Linguistic reasoning"
  }
]
\`\`\`
If there are no errors, output an empty array: \`[]\`. Output nothing except valid JSON.`;

    // 4. Construct User Prompt
    const userPrompt = `[ORIGINAL HTML]
${originalHtml}
[/ORIGINAL_HTML]

[TRANSLATED HTML]
${translatedHtml}
[/TRANSLATED_HTML]

Please review the translation and output the JSON list of errors.`;

    // 5. Execute Prompt using ModelsService (with Gemini fallback)
    const response = await this.modelsService.executePrompt(
      AgentType.REVIEW,
      `${systemPrompt}\n\n${userPrompt}`,
      {
        temperature: 0.1,
        max_tokens: 4096,
      },
      modelOverride,
    );

    // 6. Safely Parse and Validate JSON
    try {
      const textResponse = response.text.trim();
      const jsonMatch = textResponse.match(/\[\s*\{[\s\S]*\}\s*\]/) || textResponse.match(/\[\s*\]/);

      if (!jsonMatch) {
        throw new Error(`Failed to extract JSON array from review response. Raw response: ${textResponse}`);
      }

      const parsed = JSON.parse(jsonMatch[0]) as any[];

      // Map and robustly parse error severity/category values to match Prisma enums perfectly
      const mappedErrors: ReviewErrorOutput[] = parsed.map((err) => {
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
          location: err.location || 'page',
          currentText: err.currentText || '',
          suggestedText: err.suggestedText || '',
          issueDescription: err.issueDescription || 'Linguistic issue detected.',
          reference: err.reference || null,
          aiNote: err.aiNote || null,
        };
      });

      return { errors: mappedErrors, modelUsed: response.model };
    } catch (parseErr) {
      this.logger.error(`Failed parsing review response: ${(parseErr as Error).message}`);
      return { errors: [], modelUsed: response.model };
    }
  }
}