import { Module, Global } from '@nestjs/common';
import { MinIOService } from './minio.service';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FilesController],
  providers: [MinIOService, FilesService],
  exports: [MinIOService, FilesService],
})
export class FilesModule {}