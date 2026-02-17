import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { NotificationService } from 'src/notification/notification.service';
import { User } from 'src/prisma/generated';
import { PrismaService } from 'src/prisma/prisma.service';
import { role, roleProject } from 'src/utils/enum';
import { queryMessage, queryPage, UserWithRole } from 'src/utils/type';
import { messageDTO } from './dto';
import { MessageGateway } from './message.gateway';
import { isEndList } from 'src/utils/function';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MessageGateway))
    private socket: MessageGateway,
    private notification: NotificationService,
  ) {}
  async projectName(projectId: string, user: UserWithRole) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Project introuvable');
    }
    const isAdmin = user.role.name === role.ADMIN;
    if (!isAdmin) {
      const didUserInProject = await this.prisma.user_Has_Project.findFirst({
        where: { userId: user.id, projectId, isBanned: false },
        select: { role: { select: { name: true } } },
      });
      if (!didUserInProject) {
        throw new ForbiddenException("Vous n'êtes pas dans le projet");
      }
      const isModerator = didUserInProject.role.name === roleProject.MODERATOR;
      return {
        projectName: existingProject.name,
        isModerator,
        isAdmin: false,
        user: { username: user.username },
      };
    }
    return {
      projectName: existingProject.name,
      isAdmin,
      isModerator: false,
      user: { username: user.username },
    };
  }
  async projectMessages(
    projectId: string,
    user: UserWithRole,
    query: queryMessage,
  ) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Projet introuvable !');
    }
    const isAdmin = user.role.name === role.ADMIN;
    if (!isAdmin) {
      const didUserInProject = await this.prisma.user_Has_Project.findFirst({
        where: {
          userId: user.id,
          isBanned: false,
          projectId: existingProject.id,
        },
        select: { id: true },
      });
      if (!didUserInProject) {
        throw new ForbiddenException("Vous n'êtes pas autorisé(e) !");
      }
    }
    const take = 10;
    const skip = Number(query.items) || 0;
    const messages = await this.prisma.message.findMany({
      where: {
        projectId: existingProject.id,
        isVisible: true,
        isArchive: false,
      },
      select: {
        id: true,
        message: true,
        user: { select: { username: true, id: true } },
        createdAt: true,
        updatedAt: true,
        isArchive: false,
        isVisible: true,
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: messages,
    };
  }
  async createMessage(dto: messageDTO, projectId: string, user: User) {
    const existingProject = await this.prisma.project.findUnique({
      where: {
        id: projectId,
        users: { some: { userId: user.id, isBanned: false } },
      },
      select: {
        id: true,
        name: true,
        users: {
          where: { isBanned: false },
          select: { projectId: true, userId: true },
        },
      },
    });
    if (!existingProject) {
      throw new NotFoundException('Projet introuvable !');
    }
    const newMessage = await this.prisma.message.create({
      data: { ...dto, projectId, authorId: user.id },
      select: {
        id: true,
        createdAt: true,
        isVisible: true,
        updatedAt: true,
        projectId: true,
        message: true,
        user: {
          select: {
            username: true,
            id: true,
          },
        },
      },
    });
    this.socket.emitNewMessage(newMessage, existingProject.id);
    await this.notification.createMany(
      existingProject.users,
      'New message',
      `Un nouveau message a été envoyer dans le projet : ${existingProject.name}`,
    );
    return { message: 'Message créer !' };
  }
  async deleteMessage(messageId: string, user: UserWithRole) {
    const existingMessage = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, projectId: true, authorId: true },
    });
    if (!existingMessage) {
      throw new NotFoundException('Message introuvable !');
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
        throw new ForbiddenException("Vous n'êtes pas autoriser !");
      }
      const isModerator = didUserInProject.role.name === roleProject.MODERATOR;
      if (!isModerator && existingMessage.authorId !== user.id) {
        throw new ForbiddenException("Vous n'êtes pas autoriser !");
      }
    }
    await this.prisma.message.update({
      where: { id: existingMessage.id },
      data: { isArchive: true },
    });

    this.socket.emitDeleteMessage(
      existingMessage.id,
      existingMessage.projectId,
    );

    return { message: 'Message supprimer !' };
  }

  async deleteAllMessage(projectId: string, user: UserWithRole) {
    const isAdmin = user.role.name === role.ADMIN;
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Projet introuvable !');
    }
    if (!isAdmin) {
      const isModerator = await this.prisma.user_Has_Project.findFirst({
        where: {
          userId: user.id,
          projectId: existingProject.id,
          isBanned: false,
          role: { name: roleProject.MODERATOR },
        },
        select: { id: true },
      });
      if (!isModerator) {
        throw new ForbiddenException("Vous n'êtes pas autoriser !");
      }
    }
    await this.prisma.message.updateMany({
      where: { projectId },
      data: {
        isArchive: true,
      },
    });
    this.socket.emitResetMessage(existingProject.id);
    return { message: 'Messages supprimer !' };
  }
  async joinRoomMessage(client: Socket, projectId: string, user: User) {
    const existingUserProject = await this.prisma.user_Has_Project.findFirst({
      where: { projectId, userId: user.id, isBanned: false },
      select: { id: true },
    });
    if (!existingUserProject) {
      throw new WsException("Vous n'êtes pas membre !");
    }
    await client.join(`message/${projectId}`);
    return;
  }
  async getListMessageByUser(userId: string, query: queryPage) {
    const take = 10;
    const skip =
      Number(query.page) - 1 <= 0 || isNaN(Number(query.page))
        ? 0
        : (Number(query.page) - 1) * take;
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existingUser) {
      throw new NotFoundException('Utilisateur introuvable !');
    }
    const totalMessage = await this.prisma.message.count({
      where: { authorId: existingUser.id },
    });
    if (totalMessage === 0) {
      return { data: [], totalMessage: 0, isEndList: true };
    }
    const listMessage = await this.prisma.message.findMany({
      take,
      skip,
      where: { authorId: existingUser.id },
      select: {
        id: true,
        message: true,
        updatedAt: true,
        project: { select: { name: true } },
      },
    });
    return {
      data: listMessage,
      isEndList: isEndList(skip, take, totalMessage),
      totalMessage: totalMessage,
    };
  }
}
