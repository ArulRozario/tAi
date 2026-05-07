import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatContext, ChatMode, MessageRole, ChatSession, Provider } from '@prisma/client';
import axios from 'axios';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async findSessions(userId: string, filters: { context?: string; entityId?: string }) {
    const where: any = { userId };

    if (filters.context) {
      where.context = filters.context.toUpperCase() as ChatContext;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    return this.prisma.chatSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSession(id: string, userId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Chat session with ID ${id} not found`);
    }

    return session;
  }

  async createSession(
    userId: string,
    data: {
      context: string;
      entityId?: string;
      modelProvider?: string;
      modelName?: string;
    }
  ) {
    const context = (data.context?.toUpperCase() as ChatContext) || ChatContext.GENERAL;

    return this.prisma.chatSession.create({
      data: {
        userId,
        context,
        entityId: data.entityId || null,
        modelProvider: (data.modelProvider?.toUpperCase() as Provider) || Provider.OLLAMA,
        modelName: data.modelName || 'qwen2.5:7b',
      },
    });
  }

  async removeSession(id: string, userId: string) {
    await this.findSession(id, userId);

    await this.prisma.chatSession.delete({
      where: { id },
    });
  }

  async getQuickPrompts(context: string, mode?: string) {
    const ctx = (context?.toUpperCase() as ChatContext) || ChatContext.GENERAL;
    const md = (mode?.toUpperCase() as ChatMode) || ChatMode.PLAN;

    if (ctx === ChatContext.GENRE) {
      if (md === ChatMode.PLAN) {
        return [
          'Draft a structural outline for our glossary terms',
          'Review styling guidelines for theology translation guidelines',
          'How can we structure modern vernacular terminology?',
          'Suggest standard formatting rules for verse headers'
        ];
      } else {
        return [
          'Generate layout templates for style guides',
          'Draft standard formatting rules for terms',
          'Write instructions for theological term overrides',
          'Create translation guide draft rules'
        ];
      }
    } else if (ctx === ChatContext.REVIEW) {
      if (md === ChatMode.PLAN) {
        return [
          'Analyze general spelling issues on this page',
          'Help plan grammar fixes for these segments',
          'Identify style inconsistencies in these verses',
          'Review translator notes for accuracy context'
        ];
      } else {
        return [
          'Draft regex replacements for common spelling errors',
          'Generate correct Tamil equivalents for unresolved terms',
          'Auto-correct grammatical alignment in this verse',
          'Create bulk replace mappings for this page'
        ];
      }
    } else if (ctx === ChatContext.GLOSSARY) {
      if (md === ChatMode.PLAN) {
        return [
          'Categorize our current glossary terms',
          'Review coverage of theology rules',
          'Analyze terminology gaps',
          'Suggest semantic groupings for active terms'
        ];
      } else {
        return [
          'Generate synonymous variants for terms',
          'Create short context descriptions for key nouns',
          'Suggest definitions for unresolved theological vocabulary',
          'Build structural terminology templates'
        ];
      }
    }

    return [
      'Explain the translation workflow',
      'What are the roles of Master and Reviewer?',
      'How do I trigger page indexing?',
      'How does translation memory retrieve suggestions?'
    ];
  }

  /**
   * Enriches system context by fetching relevant entity states from DB.
   */
  private async buildSystemInstruction(context: ChatContext, entityId?: string): Promise<string> {
    const baseInstruction = 'You are tAI, a powerful theological and scripture translation assistant. Be precise, highly contextual, and prioritize theological accuracy.\n';

    if (!entityId) {
      return baseInstruction;
    }

    try {
      if (context === ChatContext.GENRE) {
        const genre = await this.prisma.genre.findUnique({
          where: { id: entityId },
          include: {
            versions: {
              orderBy: { version: 'desc' },
              take: 1,
            },
          },
        });
        if (genre) {
          const styleGuide = genre.versions[0]?.content || 'No style guide defined yet.';
          return `${baseInstruction}\nContext: You are working on the Genre "${genre.name}".\nCurrent Style Guide content:\n"""\n${styleGuide}\n"""`;
        }
      } else if (context === ChatContext.REVIEW) {
        const page = await this.prisma.page.findUnique({
          where: { id: entityId },
          include: {
            errors: true,
          },
        });
        if (page) {
          let textContext = `Context: You are reviewing Page Number ${page.pageNumber}.\nOriginal HTML:\n"""\n${page.originalHtml || ''}\n"""\nTranslated HTML:\n"""\n${page.translatedHtml || ''}\n"""\n`;
          const openErrors = page.errors.filter((e) => e.status === 'OPEN');
          if (openErrors.length > 0) {
            textContext += `Open Errors:\n${openErrors.map((e) => `- [${e.category}] "${e.currentText}" -> "${e.suggestedText}" (${e.issueDescription})`).join('\n')}\n`;
          }
          return `${baseInstruction}\n${textContext}`;
        }
      } else if (context === ChatContext.GLOSSARY) {
        const terms = await this.prisma.glossaryTerm.findMany({
          where: { genreId: entityId },
          orderBy: { sourceTerm: 'asc' },
          take: 20,
        });
        if (terms.length > 0) {
          let glossContext = 'Context: Active Glossary Terms for this Genre:\n';
          for (const t of terms) {
            glossContext += `- ${t.sourceTerm} -> ${t.targetTerm} (Context: ${t.context || 'N/A'})\n`;
          }
          return `${baseInstruction}\n${glossContext}`;
        }
      }
    } catch (e: any) {
      console.warn('[Chat] Failed to enrich system context:', e.message);
    }

    return baseInstruction;
  }

  /**
   * Helper to fetch Ollama endpoint config.
   */
  private async getOllamaEndpoint(session: ChatSession): Promise<string> {
    const config = await this.prisma.modelConfig.findFirst({
      where: { agentType: 'CHAT', isDefault: true, isActive: true },
    });
    return config?.endpoint || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
  }

  async addMessage(
    id: string,
    userId: string,
    body: { content: string; mode?: string }
  ) {
    const session = await this.findSession(id, userId);
    const mode = (body.mode?.toUpperCase() as ChatMode) || ChatMode.PLAN;

    // 1. Create and save USER message
    await this.prisma.chatMessage.create({
      data: {
        sessionId: id,
        role: MessageRole.USER,
        content: body.content,
        mode,
      },
    });

    // 2. Build system instructions
    const systemText = await this.buildSystemInstruction(session.context, session.entityId || undefined);

    // 3. Compile history
    const history = await this.prisma.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
    });

    const messages = [
      { role: 'system', content: systemText },
      ...history.map((m) => ({
        role: m.role.toLowerCase(),
        content: m.content,
      })),
    ];

    // 4. Invoke LLM
    const endpoint = await this.getOllamaEndpoint(session);
    let responseText = '';

    try {
      const llmResult = await axios.post(`${endpoint}/api/chat`, {
        model: session.modelName,
        messages,
        stream: false,
        options: { temperature: 0.3 },
      });
      responseText = llmResult.data.message?.content || '';
    } catch (err: any) {
      responseText = `[Error executing prompt: ${err.message}]`;
    }

    // 5. Save assistant response
    const savedMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId: id,
        role: MessageRole.ASSISTANT,
        content: responseText,
        mode,
      },
    });

    // 6. Support draft version updates for BUILD mode GENRE context
    if (session.context === ChatContext.GENRE && mode === ChatMode.BUILD) {
      return {
        ...savedMessage,
        genreVersionDraft: responseText,
      };
    }

    return savedMessage;
  }

  /**
   * Streams responses using Server-Sent Events (SSE) lines.
   */
  async streamResponse(
    id: string,
    userId: string,
    query: { content: string; mode?: string }
  ): Promise<Observable<{ data: string }>> {
    const session = await this.findSession(id, userId);
    const mode = (query.mode?.toUpperCase() as ChatMode) || ChatMode.PLAN;

    // 1. Create and save USER message
    await this.prisma.chatMessage.create({
      data: {
        sessionId: id,
        role: MessageRole.USER,
        content: query.content,
        mode,
      },
    });

    // 2. Build enriched context
    const systemText = await this.buildSystemInstruction(session.context, session.entityId || undefined);

    // 3. Fetch History
    const history = await this.prisma.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
    });

    const messages = [
      { role: 'system', content: systemText },
      ...history.map((m) => ({
        role: m.role.toLowerCase(),
        content: m.content,
      })),
    ];

    const endpoint = await this.getOllamaEndpoint(session);
    const subject = new Subject<{ data: string }>();

    // Run the stream generator asynchronously
    (async () => {
      let accumulatedResponse = '';

      try {
        const response = await axios.post(
          `${endpoint}/api/chat`,
          {
            model: session.modelName,
            messages,
            stream: true,
            options: { temperature: 0.3 },
          },
          { responseType: 'stream' }
        );

        const stream = response.data;
        let buffer = '';

        for await (const chunk of stream) {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              const textChunk = parsed.message?.content || '';
              accumulatedResponse += textChunk;

              subject.next({ data: JSON.stringify({ chunk: textChunk }) });
            } catch (err) {
              // Ignore line split parsing issues
            }
          }
        }

        // Flush remaining buffer
        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer);
            const textChunk = parsed.message?.content || '';
            accumulatedResponse += textChunk;
            subject.next({ data: JSON.stringify({ chunk: textChunk }) });
          } catch {
            // ignore malformed JSON
          }
        }

        // Save completed ASSISTANT response
        await this.prisma.chatMessage.create({
          data: {
            sessionId: id,
            role: MessageRole.ASSISTANT,
            content: accumulatedResponse,
            mode,
          },
        });

        // Emit final BUILD draft for GENRE contexts
        if (session.context === ChatContext.GENRE && mode === ChatMode.BUILD) {
          subject.next({ data: JSON.stringify({ genreVersionDraft: accumulatedResponse }) });
        }

        // Send terminating [DONE] event
        subject.next({ data: '[DONE]' });
        subject.complete();

      } catch (err: any) {
        const errorMsg = `[Prompt streaming failed: ${err.message}]`;
        try {
          await this.prisma.chatMessage.create({
            data: {
              sessionId: id,
              role: MessageRole.ASSISTANT,
              content: errorMsg,
              mode,
            },
          });
        } catch (dbErr) {
          console.error('[Chat] Failed to save stream error message:', dbErr);
        }
        subject.next({ data: JSON.stringify({ error: errorMsg }) });
        subject.next({ data: '[DONE]' });
        subject.complete();
      }
    })();

    return subject.asObservable();
  }
}
