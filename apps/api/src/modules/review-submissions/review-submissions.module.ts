import { Module } from '@nestjs/common';
import { ReviewSubmissionsController } from './review-submissions.controller';
import { ReviewSubmissionsService } from './review-submissions.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ReviewSubmissionsController],
  providers: [ReviewSubmissionsService],
  exports: [ReviewSubmissionsService],
})
export class ReviewSubmissionsModule {}
