import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  linkDocumentSchema,
  uuidSchema,
  type LinkDocumentInput,
  type ProjectDocLink,
} from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { DocumentService } from './document.service';

const UuidParam = () => new ZodValidationPipe(uuidSchema);

/** Documents/folders attached to a project — the project "Docs" tab. */
@Controller('projects/:projectId/docs')
export class DocumentLinkController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('projectId', UuidParam()) projectId: string,
  ): Promise<ProjectDocLink[]> {
    return this.documentService.listProjectDocs(user.id, projectId);
  }

  @Post()
  link(
    @CurrentUser() user: AuthUser,
    @Param('projectId', UuidParam()) projectId: string,
    @Body(new ZodValidationPipe(linkDocumentSchema)) dto: LinkDocumentInput,
  ): Promise<ProjectDocLink[]> {
    return this.documentService.linkToProject(user.id, projectId, dto);
  }

  @Delete(':linkId')
  unlink(
    @CurrentUser() user: AuthUser,
    @Param('projectId', UuidParam()) projectId: string,
    @Param('linkId', UuidParam()) linkId: string,
  ): Promise<ProjectDocLink[]> {
    return this.documentService.unlinkFromProject(user.id, projectId, linkId);
  }
}
