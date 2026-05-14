import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OllamaService } from './ollama.service';
import { GeminiService } from './gemini.service';
import { ModelRegistryService } from './model-registry.service';
import { ExtractionService } from './extraction.service';
import { MemoryService } from './memory.service';
import { TranslationAgent } from './translation.agent';
import { ReviewAgent } from './review.agent';
import { AgentOrchestrator } from './agent.orchestrator';
import { AgentsController } from './agents.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [HttpModule, AuthModule],
  controllers: [AgentsController],
  providers: [
    OllamaService,
    GeminiService,
    ModelRegistryService,
    ExtractionService,
    MemoryService,
    TranslationAgent,
    ReviewAgent,
    AgentOrchestrator,
  ],
  exports: [
    OllamaService,
    GeminiService,
    ModelRegistryService,
    ExtractionService,
    MemoryService,
    TranslationAgent,
    ReviewAgent,
    AgentOrchestrator,
  ],
})
export class AgentsModule {}