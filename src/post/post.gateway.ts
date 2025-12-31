import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { postType } from 'src/utils/type';
import { getClient } from 'src/auth/decorator/get-client.decorator';
import { User } from 'src/prisma/generated';
import { WsJwtGuard } from 'src/auth/Guards/ws.jwt.guard';
import { PostService } from './post.service';
@WebSocketGateway(Number(process.env.PORT_GATEWAY) || 3001, {
  cors: { origin: [`${process.env.FRONT_URL}`], credentials: true },
})
@UseGuards(WsJwtGuard)
export class PostGateway {
  constructor(
    @Inject(forwardRef(() => PostService))
    private post: PostService,
  ) {}

  @WebSocketServer() server: Server;

  @SubscribeMessage('postJoinRoom')
  joinRoomPost(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
    @getClient() user: User,
  ) {
    return this.post.joinRoomPost(client, projectId, user);
  }

  emitNewPost(post: postType, projectId: string) {
    this.server
      .to(`post/${projectId}`)
      .emit('post', { action: 'create', post });
  }
  emitUpdatePost(post: postType, projectId: string) {
    this.server
      .to(`post/${projectId}`)
      .emit('post', { action: 'update', post: post });
  }
  emitDeletePost(postId: string, projectId: string) {
    this.server
      .to(`post/${projectId}`)
      .emit('post', { action: 'delete', post: { id: postId } });
  }
  emitTransfertPost(postId: string, projectId: string) {
    this.server
      .to(`post/${projectId}`)
      .emit('post', { action: 'transfert', post: { id: postId } });
  }
  emitVotePost(postId: string, score: number, projectId: string) {
    this.server
      .to(`post/${projectId}`)
      .emit('post', { action: 'vote', post: { id: postId, score } });
  }
  emitResetPost(projectId: string) {
    this.server.to(`post/${projectId}`).emit('post', { action: 'reset' });
  }
}
