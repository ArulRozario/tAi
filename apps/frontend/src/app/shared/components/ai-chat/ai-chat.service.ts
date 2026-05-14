import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { AiChatComponent } from './ai-chat.component';

/**
 * Abstract service that drives the AiChatComponent.
 * Each usage context provides its own implementation via Angular DI.
 * The service receives the chat component instance and uses its public API
 * (beginAssistantResponse, updateAssistantMessage, finishAssistantMessage)
 * to drive the conversation.
 */
@Injectable()
export abstract class AiChatService {
  protected contentAcceptedSubject = new Subject<string>();

  /** Observable that emits whenever the user accepts assistant content */
  contentAccepted$: Observable<string> = this.contentAcceptedSubject.asObservable();

  abstract sendPrompt(
    prompt: string,
    model: string,
    chat: AiChatComponent
  ): void;

  abstract acceptContent(
    content: string,
    chat: AiChatComponent
  ): void;

  /** Optional configuration hook for context-specific setup */
  configure?(options: Record<string, any>): void {}
}
