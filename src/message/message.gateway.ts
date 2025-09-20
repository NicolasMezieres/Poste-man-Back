import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { message } from 'src/utils/type';
import { PrismaService } from 'src/prisma/prisma.service';
import { getClient } from 'src/auth/decorator/get-client.decorator';
import { User } from 'src/prisma/generated';
import { WsJwtGuard } from 'src/auth/Guards/ws.jwt.guard';

@WebSocketGateway(Number(process.env.PORT_GATEWAY) || 3001, {
  cors: { origin: ['http://localhost:4200'], credentials: true },
})
export class MessageGateway {
  constructor(private readonly prisma: PrismaService) {}
  @WebSocketServer() server: Server;

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('messageJoinRoom')
  async joinRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
    @getClient() user: User,
  ) {
    const existingUserProject = await this.prisma.user_Has_Project.findFirst({
      where: { projectId, userId: user.id, isBanned: false },
      select: { id: true },
    });
    if (!existingUserProject) {
      throw new WsException("You aren't a member !");
    }
    await client.join(projectId);
    return;
  }

  emitNewMessage(message: message, projectId: string) {
    this.server.to(projectId).emit('message', { action: 'create', message });
  }

  emitDeleteMessage(messageId: string, projectId: string) {
    this.server
      .to(projectId)
      .emit('message', { action: 'delete', message: { id: messageId } });
  }
  emitResetMessage(projectId: string) {
    this.server.to(projectId).emit('message', { action: 'reset' });
  }
}
