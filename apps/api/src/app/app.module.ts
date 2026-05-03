import { Module } from '@nestjs/common';
import { PrismaModule } from '../modules/prisma/prisma.module';
import { FilesModule } from '../modules/files/files.module';
import { AgentsModule } from '../modules/agents/agents.module';
import { ProjectsModule } from '../modules/projects/projects.module';
import { PagesModule } from '../modules/pages/pages.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    FilesModule,
    AgentsModule,
    ProjectsModule,
    PagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}