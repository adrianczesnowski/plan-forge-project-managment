import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [ProjectModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
