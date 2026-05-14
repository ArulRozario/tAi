import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { TranslationController } from './translation.controller';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [PrismaModule, AuthModule, JobsModule],
  controllers: [ProjectsController, TranslationController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}