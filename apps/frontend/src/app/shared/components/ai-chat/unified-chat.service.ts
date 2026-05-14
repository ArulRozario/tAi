import { Injectable } from '@angular/core';
import { AiChatService } from './ai-chat.service';
import { AiChatComponent } from './ai-chat.component';

/**
 * Unified chat service that calls the single /api/v1/chat endpoint
 * with context-specific parameters.
 */
@Injectable()
export class UnifiedChatService extends AiChatService {
  private context: string = 'general';
  private entityId?: string;
  private segmentId?: string;
  private currentContent?: string;

  override configure(options: {
    context: string;
    entityId?: string;
    segmentId?: string;
    currentContent?: string;
  }) {
    this.context = options.context;
    this.entityId = options.entityId;
    this.segmentId = options.segmentId;
    this.currentContent = options.currentContent;
  }

  sendPrompt(prompt: string, model: string, chat: AiChatComponent): void {
    this.doSend(prompt, model, chat).catch((err: any) => {
      const id = chat.beginAssistantResponse();
      chat.finishAssistantMessage(
        id,
        `Sorry, an unexpected error occurred: ${err.message || 'Please try again.'}`
      );
    });
  }

  acceptContent(content: string, chat: AiChatComponent): void {
    this.contentAcceptedSubject.next(content);
  }

  private async doSend(
    prompt: string,
    model: string,
    chat: AiChatComponent
  ): Promise<void> {
    const assistantId = chat.beginAssistantResponse();

    const history = chat
      .messages()
      .filter((m) => m.role === 'user')
      .slice(-2)
      .map((m) => ({ role: m.role, content: m.content }));

    const body = {
      context: this.context,
      entityId: this.entityId,
      segmentId: this.segmentId,
      prompt,
      model,
      mode: chat.planMode ? 'plan' : 'direct',
      currentContent: this.currentContent,
      history,
    };

    const response = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let rawContent = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const chunk = line.substring(6);
          if (chunk === '[DONE]') continue;
          rawContent += chunk;
          chat.updateAssistantMessage(assistantId, rawContent);
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      if (buffer.startsWith('data: ')) {
        const chunk = buffer.substring(6);
        if (chunk !== '[DONE]') {
          rawContent += chunk;
          chat.updateAssistantMessage(assistantId, rawContent);
        }
      }
    }

    chat.finishAssistantMessage(assistantId, rawContent);
  }
}
