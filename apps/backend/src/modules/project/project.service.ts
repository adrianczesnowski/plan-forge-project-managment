import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRole, SpaceRole } from '@prisma/client';
import type {
  CreateProjectInput,
  Project,
  ProjectMember,
  ProjectWithRole,
  UpdateProjectInput,
} from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { SpaceAccessService } from '../space/space-access.service';
import { ProjectAccessService } from './project-access.service';
import { toProjectDto, toProjectMemberDto, toProjectWithRole } from './project.mapper';

const SPACE_TO_PROJECT_ROLE: Partial<Record<SpaceRole, ProjectRole>> = {
  [SpaceRole.OWNER]: ProjectRole.OWNER,
  [SpaceRole.ADMIN]: ProjectRole.ADMIN,
};

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaceAccess: SpaceAccessService,
    private readonly access: ProjectAccessService,
  ) {}

  /** Space OWNER/ADMIN (incl. inherited org admins) can create projects. */
  async create(userId: string, dto: CreateProjectInput): Promise<ProjectWithRole> {
    const spaceAccess = await this.spaceAccess.require(userId, dto.spaceId, SpaceRole.ADMIN);

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        spaceId: dto.spaceId,
        createdById: userId,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });

    const myRole = SPACE_TO_PROJECT_ROLE[spaceAccess.role] ?? ProjectRole.OWNER;
    return toProjectWithRole(project, myRole);
  }

  /** Projects visible to the user within a space. */
  async listBySpace(userId: string, spaceId: string): Promise<ProjectWithRole[]> {
    const spaceAccess = await this.spaceAccess.require(userId, spaceId, SpaceRole.MEMBER);
    const inheritedRole = SPACE_TO_PROJECT_ROLE[spaceAccess.role];

    if (inheritedRole) {
      const projects = await this.prisma.project.findMany({
        where: { spaceId },
        orderBy: { createdAt: 'asc' },
      });
      return projects.map((p) => toProjectWithRole(p, inheritedRole));
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: { userId, project: { spaceId } },
      include: { project: true },
      orderBy: { project: { createdAt: 'asc' } },
    });
    return memberships.map((m) => toProjectWithRole(m.project, m.role));
  }

  async getById(userId: string, projectId: string): Promise<ProjectWithRole> {
    const access = await this.access.require(userId, projectId, ProjectRole.VIEWER);
    return toProjectWithRole(access.project, access.role);
  }

  async update(userId: string, projectId: string, dto: UpdateProjectInput): Promise<Project> {
    await this.access.require(userId, projectId, ProjectRole.ADMIN);

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate === undefined ? undefined : dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate === undefined ? undefined : dto.endDate ? new Date(dto.endDate) : null,
      },
    });
    return toProjectDto(project);
  }

  async delete(userId: string, projectId: string): Promise<void> {
    await this.access.require(userId, projectId, ProjectRole.OWNER);
    await this.prisma.project.delete({ where: { id: projectId } });
  }

  async listMembers(userId: string, projectId: string): Promise<ProjectMember[]> {
    await this.access.require(userId, projectId, ProjectRole.VIEWER);
    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map(toProjectMemberDto);
  }

  async addMember(
    actorId: string,
    projectId: string,
    dto: { userId: string; role: ProjectRole },
  ): Promise<ProjectMember> {
    const access = await this.access.require(actorId, projectId, ProjectRole.ADMIN);
    if (dto.role === ProjectRole.OWNER && access.role !== ProjectRole.OWNER) {
      throw new ForbiddenException(MESSAGES.PROJECT.CANNOT_GRANT_HIGHER_ROLE);
    }

    // Members are picked from the space; implicit admins must not get explicit rows.
    const targetSpaceAccess = await this.spaceAccess.resolve(dto.userId, access.project.spaceId);
    if (!targetSpaceAccess) {
      throw new BadRequestException(MESSAGES.PROJECT.NOT_IN_SPACE);
    }
    if (targetSpaceAccess.role !== SpaceRole.MEMBER) {
      throw new BadRequestException(MESSAGES.PROJECT.IMPLICIT_ACCESS);
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: dto.userId, projectId } },
    });
    if (existing) {
      throw new ConflictException(MESSAGES.PROJECT.ALREADY_MEMBER);
    }

    const member = await this.prisma.projectMember.create({
      data: { userId: dto.userId, projectId, role: dto.role },
      include: { user: true },
    });
    return toProjectMemberDto(member);
  }

  async updateMemberRole(
    actorId: string,
    projectId: string,
    targetUserId: string,
    role: ProjectRole,
  ): Promise<ProjectMember> {
    await this.access.require(actorId, projectId, ProjectRole.OWNER);
    const target = await this.requireProjectMember(projectId, targetUserId);

    const updated = await this.prisma.projectMember.update({
      where: { id: target.id },
      data: { role },
      include: { user: true },
    });
    return toProjectMemberDto(updated);
  }

  async removeMember(actorId: string, projectId: string, targetUserId: string): Promise<void> {
    const access = await this.access.require(actorId, projectId, ProjectRole.ADMIN);
    const target = await this.requireProjectMember(projectId, targetUserId);

    if (target.role === ProjectRole.OWNER && access.role !== ProjectRole.OWNER) {
      throw new ForbiddenException(MESSAGES.PROJECT.CANNOT_REMOVE_OWNER);
    }
    await this.prisma.projectMember.delete({ where: { id: target.id } });
  }

  private async requireProjectMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (!member) {
      throw new NotFoundException(MESSAGES.PROJECT.MEMBER_NOT_FOUND);
    }
    return member;
  }
}
