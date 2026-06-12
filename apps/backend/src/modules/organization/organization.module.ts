import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService, MembershipService],
  exports: [MembershipService],
})
export class OrganizationModule {}
