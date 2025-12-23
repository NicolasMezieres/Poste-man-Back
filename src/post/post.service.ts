import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/prisma/generated';
import { PrismaService } from 'src/prisma/prisma.service';
import { roleProject } from 'src/section/mock/section.mock';
import { role } from 'src/utils/enum';
import { UserWithRole } from 'src/utils/type';
import { postDTO, voteDTO } from './dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async posts(sectionId: string, user: UserWithRole) {
    const existingSection = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: {
        post: {
          where: { isVisible: true },
          include: {
            user: {
              select: {
                username: true,
                id: true,
              },
            },
            vote: { select: { isUp: true }, where: { userId: user.id } },
          },
          omit: { isVisible: true, sectionId: true, userId: true },
        },
        id: true,
        projectId: true,
      },
    });
    if (!existingSection) {
      throw new NotFoundException('Section not found !');
    }
    const isAdmin = user.role.name === role.ADMIN;
    const isUserInProject = await this.prisma.user_Has_Project.findFirst({
      where: { userId: user.id, projectId: existingSection.projectId },
      select: { role: { select: { name: true } } },
    });
    if (!isAdmin && !isUserInProject) {
      throw new ForbiddenException('You are unauthorized !');
    }
    const isModerator: boolean =
      isUserInProject?.role.name === roleProject.MODERATOR;
    return {
      data: existingSection.post,
      isModerator,
      isAdmin,
      user: user.username,
    };
  }

  async create(sectionId: string, dto: postDTO, user: User) {
    const existingSection = await this.prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      select: { id: true, projectId: true },
    });
    if (!existingSection) {
      throw new NotFoundException('Section not found');
    }
    const didUserInProject = await this.prisma.user_Has_Project.findFirst({
      where: {
        userId: user.id,
        isBanned: false,
        projectId: existingSection.projectId,
      },
      select: { id: true },
    });
    if (!didUserInProject) {
      throw new ForbiddenException('You are unauthorized !');
    }
    const newPost = await this.prisma.post.create({
      data: { ...dto, userId: user.id, sectionId: existingSection.id },
      include: {
        user: { select: { id: true, username: true } },
        vote: { select: { isUp: true }, where: { userId: user.id } },
      },
      omit: { userId: true, isVisible: true, sectionId: true },
    });
    return { message: 'Post created !', data: newPost };
  }
  async update(postId: string, dto: postDTO, user: User) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, id: true },
    });
    if (!existingPost) {
      throw new NotFoundException('Post not found !');
    }
    if (existingPost.userId !== user.id) {
      throw new ForbiddenException('You are unauthorized !');
    }
    await this.prisma.post.update({
      where: { id: existingPost.id },
      data: { ...dto, updatedAt: new Date() },
    });
    return { message: 'Post updated !' };
  }

  async move(postId: string, sectionId: string, user: UserWithRole) {
    const isAdmin = user.role.name === role.ADMIN;
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        sectionId: true,
        section: { select: { projectId: true } },
        id: true,
        userId: true,
      },
    });
    if (!existingPost) {
      throw new NotFoundException('Post not found !');
    }
    if (existingPost.sectionId === sectionId) {
      throw new BadRequestException('Post already in section');
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
    if (!isAdmin && existingPost.userId !== user.id) {
      const isModerator = await this.prisma.user_Has_Project.findFirst({
        where: {
          userId: user.id,
          role: { name: roleProject.MODERATOR },
          projectId: existingSection.projectId,
        },
        select: { id: true },
      });
      if (!isModerator) {
        throw new ForbiddenException('You are not authorized');
      }
    }
    await this.prisma.post.update({
      where: { id: existingPost.id },
      data: { sectionId: existingSection.id, updatedAt: new Date() },
    });
    return { message: 'Section of post changed !' };
  }
  async moveAll(sectionId: string, moveSectionId: string, user: UserWithRole) {
    if (sectionId === moveSectionId) {
      throw new BadRequestException('Need to other section !');
    }
    const existingSection = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { id: true, projectId: true },
    });
    if (!existingSection) {
      throw new NotFoundException('Section not found !');
    }
    const existingMoveSection = await this.prisma.section.findUnique({
      where: { id: moveSectionId },
      select: { id: true, projectId: true },
    });
    if (!existingMoveSection) {
      throw new NotFoundException('Section to move not found !');
    }
    if (existingSection.projectId !== existingMoveSection.projectId) {
      throw new ForbiddenException('Sections do not have the same project');
    }
    const isAdmin = user.role.name === role.ADMIN;
    if (!isAdmin) {
      const isModerator = await this.prisma.user_Has_Project.findFirst({
        where: {
          userId: user.id,
          projectId: existingSection.projectId,
          role: { name: roleProject.MODERATOR },
          isBanned: false,
        },
        select: { id: true },
      });
      if (!isModerator) {
        throw new ForbiddenException('You are unauthorized !');
      }
    }
    await this.prisma.post.updateMany({
      where: { sectionId },
      data: { sectionId: moveSectionId },
    });
    return { message: 'Posts changed section !' };
  }

  async vote(postId: string, dto: voteDTO, user: User) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId, isVisible: true },
      select: { section: { select: { projectId: true } }, id: true },
    });
    if (!existingPost) {
      throw new NotFoundException('Post not found !');
    }
    const didUserInProject = await this.prisma.user_Has_Project.findFirst({
      where: {
        userId: user.id,
        projectId: existingPost.section.projectId,
        isBanned: false,
      },
      select: { id: true },
    });
    if (!didUserInProject) {
      throw new ForbiddenException('You are unauthorized !');
    }
    const existingVote = await this.prisma.vote.findFirst({
      where: { postId, userId: user.id },
      select: { id: true, isUp: true },
    });
    if (!existingVote) {
      await this.prisma.$transaction([
        this.prisma.vote.create({
          data: { ...dto, postId, userId: user.id },
        }),
        this.prisma.post.update({
          where: { id: existingPost.id },
          data: { score: dto.isUp ? { increment: 1 } : { decrement: 1 } },
        }),
      ]);
    } else {
      switch (dto.isUp) {
        case true:
          switch (existingVote.isUp) {
            case true:
              await this.prisma.vote.update({
                where: { id: existingVote.id },
                data: {
                  isUp: null,
                  post: { update: { score: { decrement: 1 } } },
                },
              });
              break;
            case false:
              await this.prisma.vote.update({
                where: { id: existingVote.id },
                data: {
                  isUp: true,
                  post: { update: { score: { increment: 2 } } },
                },
              });
              break;
            case null:
              await this.prisma.vote.update({
                where: { id: existingVote.id },
                data: {
                  isUp: true,
                  post: { update: { score: { increment: 1 } } },
                },
              });
              break;
          }
          break;
        case false:
          switch (existingVote.isUp) {
            case true:
              await this.prisma.vote.update({
                where: { id: existingVote.id },
                data: {
                  isUp: false,
                  post: { update: { score: { decrement: 2 } } },
                },
              });
              break;
            case false:
              await this.prisma.vote.update({
                where: { id: existingVote.id },
                data: {
                  isUp: null,
                  post: { update: { score: { increment: 1 } } },
                },
              });
              break;
            case null:
              await this.prisma.vote.update({
                where: { id: existingVote.id },
                data: {
                  isUp: false,
                  post: { update: { score: { decrement: 1 } } },
                },
              });
              break;
          }
          break;
      }
    }
    return { message: 'Voted !' };
  }

  async remove(postId: string, user: UserWithRole) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId, isVisible: true },
      select: {
        id: true,
        section: { select: { projectId: true } },
        userId: true,
      },
    });
    if (!existingPost) {
      throw new NotFoundException('Post not found !');
    }
    const isAdmin = user.role.name === role.ADMIN;
    if (!isAdmin && existingPost.userId !== user.id) {
      const isModerator = await this.prisma.user_Has_Project.findFirst({
        where: {
          projectId: existingPost.section.projectId,
          userId: user.id,
          role: { name: roleProject.MODERATOR },
        },
        select: { id: true },
      });
      if (!isModerator) {
        throw new ForbiddenException('You are unauthorized !');
      }
    }

    await this.prisma.post.update({
      where: { id: existingPost.id },
      data: { isVisible: false, updatedAt: new Date(), isArchive: true },
    });
    return {
      message: 'Post deleted !',
    };
  }
  async removeAll(sectionId: string, user: UserWithRole) {
    const isAdmin = user.role.name === role.ADMIN;
    const existingSection = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { id: true, projectId: true },
    });
    if (!existingSection) {
      throw new NotFoundException('Section not found !');
    }
    if (!isAdmin) {
      const isModerator = await this.prisma.user_Has_Project.findFirst({
        where: {
          userId: user.id,
          projectId: existingSection.projectId,
          isBanned: false,
          role: { name: roleProject.MODERATOR },
        },
        select: { id: true },
      });
      if (!isModerator) {
        throw new ForbiddenException('You are unauthorized !');
      }
    }
    await this.prisma.post.updateMany({
      where: { sectionId: existingSection.id },
      data: { isVisible: false, updatedAt: new Date(), isArchive: true },
    });
    return { message: 'All post have been deleted !' };
  }
}
