import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvitationStatus, OrganizationRole, type Invitation } from '@prisma/client';
import type {
  CreateInvitationInput,
  InvitationWithInviter,
  MyOrganization,
  PendingInvitation,
} from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { MembershipService } from '../organization/membership.service';
import { toMyOrganizationDto } from '../organization/organization.mapper';
import { toInvitationWithInviter, toPendingInvitation } from './invitation.mapper';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class InvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  /** Invites an email to the actor's organization (OWNER/ADMIN only). */
  async create(actor: { id: string; email: string }, dto: CreateInvitationInput): Promise<InvitationWithInviter> {
    const membership = await this.requireAdminMembership(actor.id);
    const organizationId = membership.organizationId;
    const email = dto.email.toLowerCase();

    if (email === actor.email.toLowerCase()) {
      throw new BadRequestException(MESSAGES.INVITATION.CANNOT_INVITE_SELF);
    }

    const invitedUser = await this.prisma.user.findUnique({ where: { email } });
    if (invitedUser) {
      const alreadyMember = await this.membership.find(invitedUser.id, organizationId);
      if (alreadyMember) {
        throw new ConflictException(MESSAGES.ORGANIZATION.ALREADY_MEMBER);
      }
    }

    const pending = await this.prisma.invitation.findFirst({
      where: { email, organizationId, status: InvitationStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException(MESSAGES.INVITATION.ALREADY_SENT);
    }

    const invitation = await this.prisma.invitation.create({
      data: {
        email,
        organizationId,
        invitedById: actor.id,
        role: dto.role,
        token: randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      },
      include: { invitedBy: true },
    });

    // TODO(phase-4): send the invitation email once a mailer module exists.
    return toInvitationWithInviter(invitation);
  }

  /** All invitations of the actor's organization (admin view). */
  async listForOrganization(actorId: string): Promise<InvitationWithInviter[]> {
    const membership = await this.requireAdminMembership(actorId);
    const invitations = await this.prisma.invitation.findMany({
      where: { organizationId: membership.organizationId },
      include: { invitedBy: true },
      orderBy: { createdAt: 'desc' },
    });
    return invitations.map(toInvitationWithInviter);
  }

  /** Pending, non-expired invitations addressed to the user's email. */
  async listPendingForUser(userEmail: string): Promise<PendingInvitation[]> {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        email: userEmail.toLowerCase(),
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: { invitedBy: true, organization: true },
      orderBy: { createdAt: 'desc' },
    });
    return invitations.map(toPendingInvitation);
  }

  /** Accepting joins the organization and resolves to the new current org. */
  async accept(user: { id: string; email: string }, invitationId: string): Promise<MyOrganization> {
    const invitation = await this.requirePendingForUser(user, invitationId);

    const currentMembership = await this.membership.findCurrent(user.id);
    if (currentMembership) {
      throw new ConflictException(MESSAGES.INVITATION.USER_IN_ORGANIZATION);
    }

    const [, member] = await this.prisma.$transaction([
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      }),
      this.prisma.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role === OrganizationRole.ADMIN ? OrganizationRole.ADMIN : OrganizationRole.MEMBER,
        },
        include: { organization: true },
      }),
    ]);

    return toMyOrganizationDto(member.organization, member);
  }

  async reject(user: { id: string; email: string }, invitationId: string): Promise<void> {
    const invitation = await this.requirePendingForUser(user, invitationId);
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.REJECTED },
    });
  }

  /** Admin cancels a pending invitation in their organization. */
  async cancel(actorId: string, invitationId: string): Promise<void> {
    const membership = await this.requireAdminMembership(actorId);
    const invitation = await this.prisma.invitation.findUnique({ where: { id: invitationId } });

    if (!invitation || invitation.organizationId !== membership.organizationId) {
      throw new NotFoundException(MESSAGES.INVITATION.NOT_FOUND);
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(MESSAGES.INVITATION.NOT_PENDING);
    }

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.CANCELLED },
    });
  }

  private async requireAdminMembership(actorId: string) {
    const membership = await this.membership.findCurrent(actorId);
    if (!membership) {
      throw new NotFoundException(MESSAGES.ORGANIZATION.NOT_FOUND);
    }
    if (membership.role === OrganizationRole.MEMBER) {
      throw new ForbiddenException(MESSAGES.ORGANIZATION.FORBIDDEN);
    }
    return membership;
  }

  private async requirePendingForUser(
    user: { id: string; email: string },
    invitationId: string,
  ): Promise<Invitation> {
    const invitation = await this.prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation) {
      throw new NotFoundException(MESSAGES.INVITATION.NOT_FOUND);
    }
    if (invitation.email !== user.email.toLowerCase()) {
      throw new ForbiddenException(MESSAGES.INVITATION.NOT_FOR_YOU);
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(MESSAGES.INVITATION.NOT_PENDING);
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException(MESSAGES.INVITATION.EXPIRED);
    }
    return invitation;
  }
}
