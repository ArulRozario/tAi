import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpDownloadProgressEvent } from '@angular/common/http';
import { AiChatService } from './ai-chat.service';
import { AiChatComponent } from './ai-chat.component';

@Injectable()
export class UnifiedChatService extends AiChatService {
  private http = inject(HttpClient);

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
    const assistantId = chat.beginAssistantResponse();

    const history = chat
      .messages()
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    // Read currentContent from the chat component's live @Input,
    // falling back to the configured value
    const liveContent = chat.currentContent || this.currentContent;

    const body = {
      context: this.context,
      entityId: this.entityId,
      segmentId: this.segmentId,
      prompt,
      model,
      mode: chat.planMode ? 'plan' : 'direct',
      currentContent: liveContent,
      history,
    };

    let processedLength = 0;
    let rawContent = '';

    this.http
      .post('/api/v1/chat', body, {
        observe: 'events',
        responseType: 'text',
        reportProgress: true,
      })
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.DownloadProgress) {
            const partial = (event as HttpDownloadProgressEvent).partialText ?? '';
            const newData = partial.slice(processedLength);
            processedLength = partial.length;

            const lines = newData.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              let chunk: string;
              try {
                chunk = JSON.parse(line.slice(6));
              } catch {
                continue;
              }
              if (chunk === '[DONE]') continue;
              rawContent += chunk;
              chat.updateAssistantMessage(assistantId, rawContent);
            }
          }
        },
        error: (err) => {
          chat.finishAssistantMessage(
            assistantId,
            `Sorry, an error occurred: ${err?.message ?? 'Please try again.'}`
          );
        },
        complete: () => {
          chat.finishAssistantMessage(assistantId, rawContent);
        },
      });
  }

  acceptContent(content: string, _chat: AiChatComponent): void {
    this.contentAcceptedSubject.next(content);
  }
}
