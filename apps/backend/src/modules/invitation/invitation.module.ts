import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';

@Module({
  imports: [OrganizationModule],
  controllers: [InvitationController],
  providers: [InvitationService],
})
export class InvitationModule {}
