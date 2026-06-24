import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module';
import { ProjectModule } from '../project/project.module';
import { DocumentController } from './document.controller';
import { DocumentLinkController } from './document-link.controller';
import { DocumentService } from './document.service';

@Module({
  imports: [OrganizationModule, ProjectModule],
  controllers: [DocumentController, DocumentLinkController],
  providers: [DocumentService],
})
export class DocumentModule {}
