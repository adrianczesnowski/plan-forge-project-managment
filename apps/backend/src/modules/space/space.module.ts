import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module';
import { SpaceAccessService } from './space-access.service';
import { SpaceController } from './space.controller';
import { SpaceService } from './space.service';

@Module({
  imports: [OrganizationModule],
  controllers: [SpaceController],
  providers: [SpaceService, SpaceAccessService],
  exports: [SpaceAccessService],
})
export class SpaceModule {}
