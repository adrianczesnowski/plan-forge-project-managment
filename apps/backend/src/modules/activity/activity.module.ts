import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { EventsModule } from '../events/events.module';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [ProjectModule, EventsModule],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
