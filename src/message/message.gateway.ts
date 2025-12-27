import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { message } from 'src/utils/type';
import { getClient } from 'src/auth/decorator/get-client.decorator';
import { User } from 'src/prisma/generated';
import { WsJwtGuard } from 'src/auth/Guards/ws.jwt.guard';
import { MessageService } from './message.service';
@WebSocketGateway(Number(process.env.PORT_GATEWAY) || 3001, {
  cors: { origin: [`${process.env.FRONT_URL}`], credentials: true },
})
@UseGuards(WsJwtGuard)
export class MessageGateway {
  constructor(
    @Inject(forwardRef(() => MessageService))
    private message: MessageService,
  ) {}

  @WebSocketServer() server: Server;

  @SubscribeMessage('messageJoinRoom')
  joinRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
    @getClient() user: User,
  ) {
    return this.message.joinRoomMessage(client, projectId, user);
  }

  emitNewMessage(message: message, projectId: string) {
    this.server
      .to(`message/${projectId}`)
      .emit('message', { action: 'create', message });
  }

  emitDeleteMessage(messageId: string, projectId: string) {
    this.server
      .to(`message/${projectId}`)
      .emit('message', { action: 'delete', message: { id: messageId } });
  }
  emitResetMessage(projectId: string) {
    this.server.to(`message/${projectId}`).emit('message', { action: 'reset' });
  }
}
