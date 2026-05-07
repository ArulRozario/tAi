import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OllamaService } from './ollama.service';
import { ExtractionService } from './extraction.service';
import { MemoryService } from './memory.service';
import { TranslationAgent } from './translation.agent';
import { ReviewAgent } from './review.agent';
import { AgentOrchestrator } from './agent.orchestrator';

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    OllamaService,
    ExtractionService,
    MemoryService,
    TranslationAgent,
    ReviewAgent,
    AgentOrchestrator,
  ],
  exports: [
    OllamaService,
    ExtractionService,
    MemoryService,
    TranslationAgent,
    ReviewAgent,
    AgentOrchestrator,
  ],
})
export class AgentsModule {}