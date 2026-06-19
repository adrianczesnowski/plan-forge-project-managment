import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
  imports: [OrganizationModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
