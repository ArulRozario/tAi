import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobWorker } from './job.worker';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentsModule } from '../agents/agents.module';
import { AuthModule } from '../auth/auth.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [PrismaModule, AgentsModule, AuthModule, ExportModule],
  controllers: [JobsController],
  providers: [JobsService, JobWorker],
  exports: [JobsService],
})
export class JobsModule {}
