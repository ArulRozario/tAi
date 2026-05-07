import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [HttpModule, PrismaModule, AuthModule],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
