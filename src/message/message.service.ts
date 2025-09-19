import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/prisma/generated';
import { PrismaService } from 'src/prisma/prisma.service';
import { messageDTO } from './dto';
import { roleProject } from 'src/utils/enum';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}
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
    if (!existingProject || existingProject.length === 0) {
      throw new NotFoundException('Project not found !');
    }
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
    if (!existingProject || existingProject.length === 0) {
      throw new NotFoundException('Project not found !');
    }
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
    await this.prisma.message.create({
      data: { ...dto, projectId, authorId: user.id },
      select: null,
    });
    return { message: 'Message created !' };
  }
  async deleteMessage(messageId: string, user: User) {
    const existingMessage = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        OR: [
          { user: { id: user.id, isActive: true } },
          {
            project: {
              users: {
                some: {
                  userId: user.id,
                  role: { name: roleProject.MODERATOR },
                },
              },
            },
          },
        ],
      },
      select: { id: true },
    });
    if (!existingMessage) {
      throw new NotFoundException('Message not found !');
    }
    await this.prisma.message.delete({
      where: { id: existingMessage.id },
    });
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
    return { message: 'Messages deleted !' };
  }
}
