import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/auth/Guards/ws.jwt.guard';
import { getClient } from 'src/auth/decorator/get-client.decorator';
import { User } from 'src/prisma/generated';
import { Server, Socket } from 'socket.io';
import { ProjectService } from './project.service';
import { memberGateway, userGateway, UserWithRole } from 'src/utils/type';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@UseGuards(WsJwtGuard)
@WebSocketGateway(Number(process.env.PORT_GATEWAY) || 3001, {
  cors: { origin: ['http://localhost:4200'], credentials: true },
})
export class ProjectGateway implements OnGatewayDisconnect {
  constructor(
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService,
  ) {}

  @WebSocketServer()
  server: Server;

  private userConnected: userGateway[] = [];

  handleDisconnect(client: Socket) {
    const existingUser = this.userConnected.find(
      (user) => user.clientId === client.id,
    );
    if (existingUser) {
      this.userConnected = this.userConnected.filter(
        (user) => user.clientId != client.id,
      );
      if (
        !this.userConnected.some((user) => user.userId === existingUser.userId)
      ) {
        this.emitUserStatus(existingUser.userId, false);
      }
    }
  }

  @ApiOkResponse({ description: 'List member of project' })
  @ApiNotFoundResponse({ description: 'Project not found !' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @SubscribeMessage('listMember')
  async listMemberConnected(
    @getClient() user: UserWithRole,
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ) {
    const findUser = this.userConnected.find(
      (user) => user.clientId === client.id,
    );
    if (!findUser) {
      throw new WsException('User not connected');
    }
    findUser.projectMemberIds = [];
    const dataMember = await this.projectService.listMember(data, user);
    const memberConnected: memberGateway[] = [];
    dataMember.data.forEach((dataUser) => {
      if (this.userConnected.some((user) => user.userId === dataUser.userId)) {
        memberConnected.push({ ...dataUser, isConnected: true });
      } else {
        memberConnected.push({ ...dataUser, isConnected: false });
      }
      findUser.projectId = dataMember.projectId;
      findUser.projectMemberIds.push(dataUser.userId);
    });
    return memberConnected;
  }

  @SubscribeMessage('auth')
  newConnectedUser(@getClient() user: User, @ConnectedSocket() client: Socket) {
    if (!this.userConnected.find((user) => user.clientId === client.id)) {
      this.userConnected.push({
        clientId: client.id,
        userId: user.id,
        projectMemberIds: [],
        icon: user.icon,
      });
      this.emitUserStatus(user.id, true);
    }
  }

  emitUserStatus(userId: string, isConnected: boolean) {
    const status = isConnected ? 'online' : 'offline';
    this.userConnected.forEach((user) => {
      if (user.projectMemberIds.includes(userId)) {
        this.server.to(user.clientId).emit('auth', { userId, action: status });
      }
    });
  }

  emitUserUpdateProject(
    data: Omit<memberGateway, 'isConnected'>,
    projectId: string,
    isUserJoin: boolean,
  ) {
    const existingUser = this.userConnected.some(
      (user) => user.userId === data.userId,
    );
    const isConnected = existingUser ? true : false;
    this.userConnected.forEach((user) => {
      if (user.projectId === projectId) {
        if (isUserJoin && !user.projectMemberIds.includes(data.userId)) {
          user.projectMemberIds.push(data.userId);
          this.server.to(user.clientId).emit('auth', {
            ...data,
            isConnected: isConnected,
            action: 'userJoinProject',
          });
        } else if (!isUserJoin && user.projectMemberIds.includes(data.userId)) {
          user.projectMemberIds = user.projectMemberIds.filter(
            (userList) => userList !== data.userId,
          );
          if (user.userId === data.userId) {
            console.log("coucou c'est kick ici");
            this.server.to(user.clientId).emit('auth', { action: 'kicked' });
            this.server.to(user.clientId).disconnectSockets();
          } else {
            this.server.to(user.clientId).emit('auth', {
              userId: data.userId,
              action: 'userLeaveProject',
            });
          }
        }
      }
    });
  }
  emitUserBanned(userId: string, projectId: string, isUserBan: boolean) {
    const existingUser = this.userConnected.some(
      (user) => user.userId === userId,
    );
    const isConnected = existingUser ? true : false;
    this.userConnected.forEach((user) => {
      if (user.projectId === projectId) {
        if (user.userId === userId && isConnected && isUserBan) {
          console.log("coucou c'est ban ici");
          this.server.to(user.clientId).emit('auth', { action: 'banned' });
          this.server.to(user.clientId).disconnectSockets();
        } else if (isUserBan) {
          this.server
            .to(user.clientId)
            .emit('auth', { userId, action: 'userBanned' });
        } else if (!isUserBan) {
          this.server
            .to(user.clientId)
            .emit('auth', { userId, isConnected, action: 'userUnBanned' });
        }
      }
    });
  }
}
