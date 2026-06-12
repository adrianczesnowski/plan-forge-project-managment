import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  createCommentSchema,
  updateCommentSchema,
  uuidSchema,
  type Comment,
  type CreateCommentInput,
  type UpdateCommentInput,
} from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CommentService } from './comment.service';

const UuidParam = () => new ZodValidationPipe(uuidSchema);

@Controller()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('tasks/:taskId/comments')
  create(
    @CurrentUser() user: AuthUser,
    @Param('taskId', UuidParam()) taskId: string,
    @Body(new ZodValidationPipe(createCommentSchema)) dto: CreateCommentInput,
  ): Promise<Comment> {
    return this.commentService.create(user.id, taskId, dto);
  }

  @Get('tasks/:taskId/comments')
  listByTask(
    @CurrentUser() user: AuthUser,
    @Param('taskId', UuidParam()) taskId: string,
  ): Promise<Comment[]> {
    return this.commentService.listByTask(user.id, taskId);
  }

  @Patch('comments/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(updateCommentSchema)) dto: UpdateCommentInput,
  ): Promise<Comment> {
    return this.commentService.update(user.id, id, dto);
  }

  @Delete('comments/:id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<{ deleted: boolean }> {
    await this.commentService.delete(user.id, id);
    return { deleted: true };
  }
}
