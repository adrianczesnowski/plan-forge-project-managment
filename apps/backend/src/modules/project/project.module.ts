import { Module } from '@nestjs/common';
import { SpaceModule } from '../space/space.module';
import { ProjectAccessService } from './project-access.service';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [SpaceModule],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectAccessService],
  exports: [ProjectAccessService],
})
export class ProjectModule {}
