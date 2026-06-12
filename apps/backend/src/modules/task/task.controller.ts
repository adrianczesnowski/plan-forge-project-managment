import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  bulkTaskActionSchema,
  createTaskSchema,
  moveTaskSchema,
  reorderTasksSchema,
  updateTaskSchema,
  uuidSchema,
  type BulkTaskActionInput,
  type CreateTaskInput,
  type MoveTaskInput,
  type ReorderTasksInput,
  type Task,
  type TaskTreeNode,
  type UpdateTaskInput,
} from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TaskService } from './task.service';

const UuidParam = () => new ZodValidationPipe(uuidSchema);

@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('tasks')
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTaskSchema)) dto: CreateTaskInput,
  ): Promise<Task> {
    return this.taskService.create(user.id, dto);
  }

  @Get('projects/:projectId/tasks')
  listTree(
    @CurrentUser() user: AuthUser,
    @Param('projectId', UuidParam()) projectId: string,
  ): Promise<TaskTreeNode[]> {
    return this.taskService.listTree(user.id, projectId);
  }

  // Static segments before ':id' so they are not parsed as task ids.
  @Patch('tasks/reorder')
  reorder(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(reorderTasksSchema)) dto: ReorderTasksInput,
  ): Promise<TaskTreeNode[]> {
    return this.taskService.reorder(user.id, dto);
  }

  @Post('tasks/bulk')
  bulk(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(bulkTaskActionSchema)) dto: BulkTaskActionInput,
  ): Promise<{ affected: number }> {
    return this.taskService.bulk(user.id, dto);
  }

  @Get('tasks/:id')
  getById(@CurrentUser() user: AuthUser, @Param('id', UuidParam()) id: string): Promise<Task> {
    return this.taskService.getById(user.id, id);
  }

  @Patch('tasks/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) dto: UpdateTaskInput,
  ): Promise<Task> {
    return this.taskService.update(user.id, id, dto);
  }

  @Delete('tasks/:id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<{ deleted: boolean }> {
    await this.taskService.delete(user.id, id);
    return { deleted: true };
  }

  @Patch('tasks/:id/move')
  move(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(moveTaskSchema)) dto: MoveTaskInput,
  ): Promise<TaskTreeNode[]> {
    return this.taskService.move(user.id, id, dto);
  }
}
