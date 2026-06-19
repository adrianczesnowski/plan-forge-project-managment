import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { ActivityModule } from '../activity/activity.module';
import { EventsModule } from '../events/events.module';
import { NotificationModule } from '../notification/notification.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { WbsService } from './wbs.service';

@Module({
  imports: [ProjectModule, ActivityModule, EventsModule, NotificationModule],
  controllers: [TaskController],
  providers: [TaskService, WbsService],
  exports: [TaskService],
})
export class TaskModule {}
