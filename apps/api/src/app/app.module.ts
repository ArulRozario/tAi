import { Module } from '@nestjs/common';
import { PrismaModule } from '../modules/prisma/prisma.module';
import { FilesModule } from '../modules/files/files.module';
import { AgentsModule } from '../modules/agents/agents.module';
import { ProjectsModule } from '../modules/projects/projects.module';
import { PagesModule } from '../modules/pages/pages.module';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { ExportModule } from '../modules/export/export.module';
import { GenresModule } from '../modules/genres/genres.module';
import { ModelsModule } from '../modules/models/models.module';
import { JobsModule } from '../modules/jobs/jobs.module';
import { SentencesModule } from '../modules/sentences/sentences.module';
import { ErrorsModule } from '../modules/errors/errors.module';
import { GlossaryModule } from '../modules/glossary/glossary.module';
import { ChatModule } from '../modules/chat/chat.module';
import { DashboardModule } from '../modules/dashboard/dashboard.module';
import { QueueModule } from '../modules/queue/queue.module';
import { AdminModule } from '../modules/admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    FilesModule,
    AgentsModule,
    ProjectsModule,
    PagesModule,
    AuthModule,
    UsersModule,
    ExportModule,
    GenresModule,
    ModelsModule,
    JobsModule,
    SentencesModule,
    ErrorsModule,
    GlossaryModule,
    ChatModule,
    DashboardModule,
    QueueModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}