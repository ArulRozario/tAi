import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '../modules/prisma/prisma.module';
import { FilesModule } from '../modules/files/files.module';
import { AgentsModule } from '../modules/agents/agents.module';
import { ProjectsModule } from '../modules/projects/projects.module';
import { PagesModule } from '../modules/pages/pages.module';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { ExportModule } from '../modules/export/export.module';
import { StyleGuidesModule } from '../modules/style-guides/style-guides.module';
import { ModelsModule } from '../modules/models/models.module';
import { JobsModule } from '../modules/jobs/jobs.module';
import { ErrorsModule } from '../modules/errors/errors.module';
import { GlossaryModule } from '../modules/glossary/glossary.module';
import { ChatModule } from '../modules/chat/chat.module';
import { DashboardModule } from '../modules/dashboard/dashboard.module';
import { QueueModule } from '../modules/queue/queue.module';
import { AdminModule } from '../modules/admin/admin.module';
import { HealthModule } from '../modules/health/health.module';
import { ReviewSubmissionsModule } from '../modules/review-submissions/review-submissions.module';
import { CollectionsModule } from '../modules/collections/collections.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
        transport: process.env['NODE_ENV'] !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
          : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    PrismaModule,
    FilesModule,
    AgentsModule,
    ProjectsModule,
    PagesModule,
    AuthModule,
    UsersModule,
    ExportModule,
    StyleGuidesModule,
    ModelsModule,
    JobsModule,
    ErrorsModule,
    GlossaryModule,
    ChatModule,
    DashboardModule,
    QueueModule,
    AdminModule,
    HealthModule,
    ReviewSubmissionsModule,
    CollectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}