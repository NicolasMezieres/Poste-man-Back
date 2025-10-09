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

  private userConnected: {
    clientId: string;
    userId: string;
    projectMemberIds: string[];
    projectId?: string;
  }[] = [];

  handleDisconnect(client: Socket) {
    const existingUser = this.userConnected.find(
      (user) => user.clientId === client.id,
    );
    if (existingUser) {
      this.userConnected = this.userConnected.filter((user) => {
        return user.clientId != client.id;
      });
      if (
        !this.userConnected.some((user) => user.userId === existingUser.userId)
      ) {
        this.emitUserStatus(existingUser.userId, false);
      }
    }
  }

  @SubscribeMessage('listMember')
  async listMemberConnected(
    @getClient() user: User,
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
    const memberConnected: {
      user: {
        username: string;
        icon: {
          image: string;
        } | null;
      };
      userId: string;
      isBanned: boolean;
      isConnected: boolean;
    }[] = [];
    dataMember.data.users.forEach((dataUser) => {
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
      });
      this.emitUserStatus(user.id, true);
    }
  }

  emitUserStatus(userId: string, isConnected: boolean) {
    const status = isConnected ? 'online' : 'offline';
    this.userConnected.forEach((user) => {
      if (user.projectMemberIds.includes(userId)) {
        this.server.to(user.clientId).emit(status, { userId });
      }
    });
  }

  emitUserUpdateProject(
    data: {
      user: {
        username: string;
        icon: {
          image: string;
        } | null;
      };
      userId: string;
      isBanned: boolean;
    },
    projectId: string,
    isUserJoin: boolean,
  ) {
    const existingUser = this.userConnected.some(
      (user) => user.userId === data.userId,
    );
    const isConnected = existingUser ? true : false;
    this.userConnected.forEach((user) => {
      console.log(data.userId, user.userId);
      if (user.projectId === projectId) {
        console.log("cas ou l'utilisateur est dans le projet");
        if (isUserJoin && !user.projectMemberIds.includes(data.userId)) {
          console.log('emit join project');
          user.projectMemberIds.push(data.userId);
          this.server
            .to(user.clientId)
            .emit('userJoinProject', { ...data, isConnected: isConnected });
        } else if (!isUserJoin && user.projectMemberIds.includes(data.userId)) {
          user.projectMemberIds = user.projectMemberIds.filter(
            (userList) => userList !== data.userId,
          );
          if (user.userId === data.userId) {
            console.log(
              "emit deconnection de l'user kick",
              user.clientId,
              user.userId,
            );
            this.server.to(user.clientId).disconnectSockets();
          } else {
            console.log(
              'emit user leave project or kick',
              user.clientId,
              user.userId,
            );
            this.server
              .to(user.clientId)
              .emit('userLeaveProject', { userId: data.userId });
          }
        }
      }
    });
  }
}
