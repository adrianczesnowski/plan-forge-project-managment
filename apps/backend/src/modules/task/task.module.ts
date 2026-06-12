import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { WbsService } from './wbs.service';

@Module({
  imports: [ProjectModule],
  controllers: [TaskController],
  providers: [TaskService, WbsService],
  exports: [TaskService],
})
export class TaskModule {}
