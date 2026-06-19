import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ProjectModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
