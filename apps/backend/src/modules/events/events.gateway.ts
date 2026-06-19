import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { ProjectAccessService } from '../project/project-access.service';
import type { JwtPayload } from '../auth/types/jwt-payload';

/** Realtime event names emitted to project rooms. */
export type RealtimeEvent = 'task:changed' | 'comment:changed' | 'activity:changed';

/** Events emitted to a single user's room. */
export type UserEvent = 'notification:new';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class EventsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  /** Authenticate the socket from its handshake access token; drop if invalid. */
  handleConnection(client: Socket): void {
    try {
      const token = (client.handshake.auth?.token ?? '') as string;
      const payload = this.jwt.verify<JwtPayload>(token);
      client.data.userId = payload.sub;
      // Personal room for direct notifications.
      void client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('subscribe:project')
  async onSubscribeProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId || typeof projectId !== 'string') return;
    const access = await this.projectAccess.resolve(userId, projectId);
    if (access) await client.join(`project:${projectId}`);
  }

  @SubscribeMessage('unsubscribe:project')
  onUnsubscribeProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string): void {
    if (typeof projectId === 'string') void client.leave(`project:${projectId}`);
  }

  /** Broadcast an event to everyone watching a project. */
  emitToProject(projectId: string, event: RealtimeEvent, payload: Record<string, unknown>): void {
    this.server?.to(`project:${projectId}`).emit(event, payload);
  }

  /** Send an event to a single user (all their open tabs). */
  emitToUser(userId: string, event: UserEvent, payload: Record<string, unknown>): void {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }
}
