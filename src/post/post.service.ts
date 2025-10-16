import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/prisma/generated';
import { PrismaService } from 'src/prisma/prisma.service';
import { postDTO } from './dto';
import { roleProject } from 'src/section/mock/section.mock';
import { UserWithRole } from 'src/utils/type';
import { role } from 'src/utils/enum';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async posts(sectionId: string, user: UserWithRole) {
    const existingSection = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: {
        post: { include: { user: { select: { username: true, id: true } } } },
        projectId: true,
      },
    });
    if (!existingSection) {
      throw new NotFoundException('Section not found');
    }
    const isAdmin = user.role.name === role.ADMIN;
    const isUserInProject = await this.prisma.user_Has_Project.findFirst({
      where: { userId: user.id, projectId: existingSection.projectId },
    });
    if (!isAdmin && !isUserInProject) {
      throw new ForbiddenException('You are unauthorized !');
    }
    return { data: existingSection.post };
  }

  async create(sectionId: string, dto: postDTO, user: User) {
    const existingSection = await this.prisma.section.findFirst({
      where: {
        id: sectionId,
        project: { users: { some: { userId: user.id, isBanned: false } } },
      },
    });
    if (!existingSection) {
      throw new ForbiddenException('Section not found');
    }
    await this.prisma.post.create({
      data: { ...dto, userId: user.id, sectionId },
    });
  }

  async update(postId: string, dto: postDTO, user: User) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId, userId: user.id },
    });
    if (!existingPost) {
      throw new ForbiddenException('Post not found !');
    }
    await this.prisma.post.update({
      where: { id: existingPost.id },
      data: { ...dto, updatedAt: new Date() },
    });
    return { message: 'Post updated !' };
  }

  async move(postId: string, sectionId: string, user: UserWithRole) {
    const isAdmin = user.role.name === role.ADMIN ? true : false;
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        section: { select: { projectId: true } },
        id: true,
        userId: true,
      },
    });
    if (!existingPost) {
      throw new NotFoundException('Post not found !');
    }
    const existingSection = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { projectId: true, id: true },
    });
    if (!existingSection) {
      throw new NotFoundException('Section not found !');
    }
    if (existingSection.projectId !== existingPost.section.projectId) {
      throw new ForbiddenException(
        'Project is not the same project of section',
      );
    }
    const isModerator = await this.prisma.user_Has_Project.findFirst({
      where: {
        userId: user.id,
        role: { name: roleProject.MODERATOR },
        projectId: existingSection.projectId,
      },
      select: { id: true },
    });
    if (!isModerator && !isAdmin && existingPost.userId !== user.id) {
      throw new ForbiddenException('You are not authorized');
    }

    await this.prisma.post.update({
      where: { id: existingPost.id },
      data: { sectionId: existingSection.id },
    });
    return { message: 'Section of post changed !' };
  }

  async remove(postId: string, user: UserWithRole) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        section: { select: { projectId: true } },
        userId: true,
      },
    });
    if (!existingPost) {
      throw new NotFoundException('Post not found !');
    }
    const isModerator = await this.prisma.user_Has_Project.findFirst({
      where: {
        projectId: existingPost.section.projectId,
        userId: existingPost.userId,
        role: { name: roleProject.MODERATOR },
      },
      select: { id: true },
    });
    const isAdmin = user.role.name === role.ADMIN;
    if (!isAdmin && !isModerator && existingPost.userId !== user.id) {
      throw new ForbiddenException('You are unauthorized !');
    }
    await this.prisma.post.update({
      where: { id: existingPost.id },
      data: { isVisible: false, updatedAt: new Date() },
    });
  }
}
