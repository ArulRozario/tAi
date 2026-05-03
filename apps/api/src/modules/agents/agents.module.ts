import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OllamaService } from './ollama.service';
import { TranslationAgent } from './translation.agent';
import { ReviewAgent } from './review.agent';
import { AgentOrchestrator } from './agent.orchestrator';

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    OllamaService,
    TranslationAgent,
    ReviewAgent,
    AgentOrchestrator,
  ],
  exports: [
    OllamaService,
    TranslationAgent,
    ReviewAgent,
    AgentOrchestrator,
  ],
})
export class AgentsModule {}