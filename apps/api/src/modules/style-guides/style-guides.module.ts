import { Module } from '@nestjs/common';
import { StyleGuidesService } from './style-guides.service';
import { StyleGuidesController } from './style-guides.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ModelsModule } from '../models/models.module';

@Module({
  imports: [PrismaModule, AuthModule, ModelsModule],
  controllers: [StyleGuidesController],
  providers: [StyleGuidesService],
  exports: [StyleGuidesService],
})
export class StyleGuidesModule {}
