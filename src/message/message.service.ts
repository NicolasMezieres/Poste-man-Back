import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/prisma/generated';
import { PrismaService } from 'src/prisma/prisma.service';
import { messageDTO } from './dto';
import { role, roleProject } from 'src/utils/enum';
import { MessageGateway } from './message.gateway';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { UserWithRole } from 'src/utils/type';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MessageGateway))
    private socket: MessageGateway,
  ) {}
  private selectProjectMessages = {
    id: true,
    message: true,
    user: { select: { username: true } },
    createdAt: true,
    updatedAt: true,
  };
  async projectMessages(projectId: string, user: User) {
    const existingProject = await this.prisma.message.findMany({
      where: {
        isVisible: true,
        project: {
          id: projectId,
          users: { some: { userId: user.id, isBanned: false } },
        },
      },
      orderBy: { createdAt: 'desc' },
      select: this.selectProjectMessages,
    });
    return { data: existingProject };
  }
  async projectMessagesAdmin(projectId: string) {
    const existingProject = await this.prisma.message.findMany({
      where: {
        isVisible: true,
        project: {
          id: projectId,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: this.selectProjectMessages,
    });
    return { data: existingProject };
  }
  async createMessage(dto: messageDTO, projectId: string, user: User) {
    const existingProject = await this.prisma.project.findUnique({
      where: {
        id: projectId,
        users: { some: { userId: user.id, isBanned: false } },
      },
      select: { id: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found !');
    }
    const newMessage = await this.prisma.message.create({
      data: { ...dto, projectId, authorId: user.id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        projectId: true,
        message: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });
    this.socket.emitNewMessage(newMessage, projectId);
    return { message: 'Message created !' };
  }
  async deleteMessage(messageId: string, user: UserWithRole) {
    const existingMessage = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, projectId: true, authorId: true },
    });
    if (!existingMessage) {
      throw new NotFoundException('Message not found !');
    }
    const isAdmin = user.role.name === role.ADMIN;
    if (!isAdmin) {
      const didUserInProject = await this.prisma.user_Has_Project.findFirst({
        where: {
          userId: user.id,
          projectId: existingMessage.projectId,
          isBanned: false,
        },
        select: {
          role: { select: { name: true } },
          userId: true,
        },
      });
      if (!didUserInProject) {
        throw new ForbiddenException('You are unauthorized !');
      }
      const isModerator = didUserInProject.role.name === roleProject.MODERATOR;
      if (!isModerator && existingMessage.authorId !== user.id) {
        throw new ForbiddenException('You are unauthorized !');
      }
    }
    await this.prisma.message.delete({
      where: { id: existingMessage.id },
    });

    this.socket.emitDeleteMessage(
      existingMessage.id,
      existingMessage.projectId,
    );

    return { message: 'Message deleted !' };
  }

  async deleteAllMessage(projectId: string, user: User) {
    const existingProject = await this.prisma.user_Has_Project.findFirst({
      where: {
        projectId,
        userId: user.id,
        role: { name: roleProject.MODERATOR },
      },
      select: { id: true },
    });
    if (!existingProject) {
      throw new ForbiddenException("You doesn't have access to this action !");
    }
    await this.prisma.message.deleteMany({
      where: { projectId },
    });
    this.socket.emitResetMessage(projectId);
    return { message: 'Messages deleted !' };
  }
  async joinRoomMessage(client: Socket, projectId: string, user: User) {
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
}
