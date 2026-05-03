import { Module, Global } from '@nestjs/common';
import { MinIOService } from './minio.service';

@Global()
@Module({
  providers: [MinIOService],
  exports: [MinIOService],
})
export class FilesModule {}