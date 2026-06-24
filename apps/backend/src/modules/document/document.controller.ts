import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  createDocumentSchema,
  moveDocumentSchema,
  setDocumentPermissionSchema,
  updateDocumentSchema,
  uuidSchema,
  type CreateDocumentInput,
  type DocumentDetail,
  type DocumentNode,
  type DocumentPermission,
  type DocumentTreeNode,
  type MoveDocumentInput,
  type SetDocumentPermissionInput,
  type UpdateDocumentInput,
} from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { DocumentService } from './document.service';

const UuidParam = () => new ZodValidationPipe(uuidSchema);

@Controller('docs')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('tree')
  getTree(@CurrentUser() user: AuthUser): Promise<DocumentTreeNode[]> {
    return this.documentService.getTree(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createDocumentSchema)) dto: CreateDocumentInput,
  ): Promise<DocumentNode> {
    return this.documentService.create(user.id, dto);
  }

  @Get(':id')
  getById(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<DocumentDetail> {
    return this.documentService.getById(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(updateDocumentSchema)) dto: UpdateDocumentInput,
  ): Promise<DocumentNode> {
    return this.documentService.update(user.id, id, dto);
  }

  @Patch(':id/move')
  move(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(moveDocumentSchema)) dto: MoveDocumentInput,
  ): Promise<DocumentNode> {
    return this.documentService.move(user.id, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<{ deleted: boolean }> {
    await this.documentService.delete(user.id, id);
    return { deleted: true };
  }

  @Get(':id/permissions')
  listPermissions(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<DocumentPermission[]> {
    return this.documentService.listPermissions(user.id, id);
  }

  @Post(':id/permissions')
  setPermission(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(setDocumentPermissionSchema)) dto: SetDocumentPermissionInput,
  ): Promise<DocumentPermission[]> {
    return this.documentService.setPermission(user.id, id, dto);
  }

  @Delete(':id/permissions/:userId')
  removePermission(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Param('userId', UuidParam()) userId: string,
  ): Promise<DocumentPermission[]> {
    return this.documentService.removePermission(user.id, id, userId);
  }
}
