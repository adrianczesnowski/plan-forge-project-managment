import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { DependencyController } from './dependency.controller';
import { DependencyService } from './dependency.service';

@Module({
  imports: [ProjectModule],
  controllers: [DependencyController],
  providers: [DependencyService],
})
export class DependencyModule {}
