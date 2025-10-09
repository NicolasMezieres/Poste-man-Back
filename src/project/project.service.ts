import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/prisma/generated';
import { PrismaService } from 'src/prisma/prisma.service';
import { isEndList } from 'src/utils/const';
import { roleProject } from 'src/utils/enum';
import { querySearchAdminProject, querySearchProject } from 'src/utils/type';
import { projectDTO } from './dto';
import { ProjectGateway } from './project.gateway';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ProjectGateway))
    private socket: ProjectGateway,
  ) {}

  async search(query: querySearchProject, user: User) {
    const take = 10;
    const skip =
      Number(query.page) - 1 <= 0 || isNaN(Number(query.page))
        ? 0
        : (Number(query.page) - 1) * take;
    const countProject = await this.prisma.user_Has_Project.count({
      where: { userId: user.id, isBanned: false },
    });
    const listProject = await this.prisma.user_Has_Project.findMany({
      where: { userId: user.id, isBanned: false },
      select: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { project: { updatedAt: 'desc' } },
      skip,
      take,
    });
    return {
      data: listProject,
      total: countProject,
      isEndList: isEndList(skip, take, countProject),
    };
  }
  async searchByAdmin(query: querySearchAdminProject) {
    const take = 10;
    const skip =
      Number(query.page) - 1 <= 0 || isNaN(Number(query.page))
        ? 0
        : (Number(query.page) - 1) * take;
    const whereData = {
      OR: [
        {
          users: {
            some: {
              AND: [
                {
                  user: { username: { contains: query?.search } },
                  role: { name: roleProject.MODERATOR },
                },
              ],
            },
          },
        },
        { name: { contains: query?.search } },
      ],
      updatedAt: {
        gte:
          new Date(query.fromDate).toString() != 'Invalid Date'
            ? new Date(query.fromDate)
            : undefined,
        lte:
          new Date(query.toDate).toString() != 'Invalid Date'
            ? new Date(
                new Date(query.toDate).setDate(
                  new Date(query.toDate).getDate() + 1,
                ),
              )
            : undefined,
      },
    };
    const countProject = await this.prisma.project.count({
      where: whereData,
    });
    const listProject = await this.prisma.project.findMany({
      where: whereData,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        users: {
          where: { role: { name: roleProject.MODERATOR } },
          select: { user: { select: { username: true } } },
        },
        _count: { select: { users: true, section: true } },
        section: { select: { _count: { select: { post: true } } } },
      },
      skip,
      take,
    });

    return {
      data: listProject,
      total: countProject,
      isEndList: isEndList(skip, take, countProject),
    };
  }

  async listMember(projectId: string, user: User) {
    const listMember = await this.prisma.project.findFirst({
      where: {
        users: { some: { projectId, userId: user.id, isBanned: false } },
      },
      select: {
        users: {
          select: {
            userId: true,
            user: {
              select: { username: true, icon: { select: { image: true } } },
            },
            isBanned: true,
          },
        },
      },
    });
    if (!listMember) {
      throw new NotFoundException('Project Not found');
    }
    return { data: listMember, projectId };
  }

  async create(dto: projectDTO, user: User) {
    const moderatorRole = await this.prisma.role_Project.findUnique({
      where: { name: roleProject.MODERATOR },
      select: { id: true },
    });
    if (!moderatorRole) {
      throw new InternalServerErrorException('Role project not found');
    }
    const newProject = await this.prisma.project.create({
      data: { name: dto.name },
      select: { id: true },
    });
    await this.prisma.user_Has_Project.create({
      data: {
        userId: user.id,
        projectId: newProject.id,
        roleProjectId: moderatorRole.id,
      },
      select: null,
    });
    return { message: 'Project successfully create !' };
  }

  async createInvitationLink(projectId: string, user: User) {
    const existingProject = await this.prisma.user_Has_Project.findFirst({
      where: {
        projectId: projectId,
        userId: user.id,
        role: { name: roleProject.MODERATOR },
      },
      select: { project: { select: { id: true } } },
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found !');
    }
    const link = await this.prisma.link_Project.create({
      data: {
        projectId: existingProject.project.id,
        outdatedAt: new Date(
          new Date().setMinutes(new Date().getMinutes() + 10),
        ),
      },
      select: { id: true, outdatedAt: true },
    });
    return { message: 'Link created !', data: link };
  }

  async joinProject(linkId: string, user: User) {
    const existingLink = await this.prisma.link_Project.findUnique({
      where: {
        id: linkId,
      },
      select: {
        numberUsage: true,
        projet: {
          select: { id: true, name: true, users: { select: { userId: true } } },
        },
        outdatedAt: true,
      },
    });
    if (!existingLink || existingLink.numberUsage <= 0) {
      throw new NotFoundException('Link invalid !');
    } else if (existingLink.outdatedAt < new Date()) {
      throw new ForbiddenException('Link expired !');
    } else if (
      existingLink.projet.users.some(
        (userProject) => userProject.userId === user.id,
      )
    ) {
      throw new ForbiddenException('You are already in the project !');
    }
    const memberRole = await this.prisma.role_Project.findUnique({
      where: { name: roleProject.MEMBER },
      select: { id: true },
    });
    if (!memberRole) {
      throw new InternalServerErrorException('Role not found !');
    }
    const [userMember] = await this.prisma.$transaction([
      this.prisma.user_Has_Project.create({
        data: {
          userId: user.id,
          projectId: existingLink.projet.id,
          roleProjectId: memberRole.id,
        },
        select: {
          userId: true,
          isBanned: true,
          user: {
            select: { username: true, icon: { select: { image: true } } },
          },
        },
      }),
      this.prisma.link_Project.update({
        where: { id: linkId },
        data: { numberUsage: { decrement: 1 } },
        select: null,
      }),
    ]);
    if (!userMember) {
      throw new InternalServerErrorException(
        'Failed to create user project member',
      );
    }
    this.socket.emitUserUpdateProject(userMember, existingLink.projet.id, true);
    return { message: `Welcome to ${existingLink.projet.name} !` };
  }
  async ban(projectId: string, userId: string, user: User) {
    const existingModerator = await this.prisma.user_Has_Project.findFirst({
      where: {
        userId: user.id,
        projectId: projectId,
        role: { name: roleProject.MODERATOR },
      },
      select: { id: true, projectId: true },
    });
    if (!existingModerator) {
      throw new ForbiddenException('You are unauthorized 😡 !');
    }
    const existingMember = await this.prisma.user_Has_Project.findFirst({
      where: {
        userId: userId,
        projectId: projectId,
        role: { name: { not: roleProject.MODERATOR } },
      },
      select: { id: true, isBanned: true },
    });
    if (!existingMember) {
      throw new NotFoundException('Not found member !');
    }
    await this.prisma.user_Has_Project.update({
      where: { id: existingMember.id },
      data: { isBanned: !existingMember.isBanned },
      select: null,
    });
    return { message: 'Ban status updated' };
  }
  async rename(dto: projectDTO, projectId: string, user: User) {
    const existingModerator = await this.prisma.user_Has_Project.findFirst({
      where: {
        projectId: projectId,
        userId: user.id,
        role: { name: roleProject.MODERATOR },
      },
      select: { projectId: true },
    });
    if (!existingModerator) {
      throw new NotFoundException('Project not found !');
    }
    await this.prisma.project.update({
      where: { id: existingModerator.projectId },
      data: { ...dto },
      select: null,
    });
    return { message: 'Project modified !' };
  }

  async remove(projectId: string, user: User) {
    const existingProject = await this.prisma.user_Has_Project.findFirst({
      where: { projectId, userId: user.id, isBanned: false },
      select: { id: true, projectId: true, role: { select: { name: true } } },
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found');
    } else if (
      (existingProject.role.name as roleProject) === roleProject.MODERATOR
    ) {
      await this.prisma.$transaction(async (tPrisma) => {
        await tPrisma.post.deleteMany({
          where: { section: { projectId: existingProject.projectId } },
        });
        await tPrisma.section.deleteMany({
          where: { projectId: existingProject.projectId },
        });
        await tPrisma.message.deleteMany({
          where: { projectId: existingProject.projectId },
        });
        await tPrisma.project.delete({
          where: { id: existingProject.projectId },
        });
      });
      return { message: 'Project deleted !' };
    } else {
      await this.prisma.user_Has_Project.delete({
        where: { id: existingProject.id },
      });
      return { message: 'Project leaved !' };
    }
  }

  async kickUser(projectId: string, userId: string, user: User) {
    const existingProject = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        AND: [
          {
            users: {
              some: {
                userId,
                role: { name: roleProject.MEMBER },
              },
            },
          },
          {
            users: {
              some: { userId: user.id, role: { name: roleProject.MODERATOR } },
            },
          },
        ],
      },
      select: {
        users: {
          where: { userId },
          select: {
            id: true,
            userId: true,
            isBanned: true,
            user: {
              select: { username: true, icon: { select: { image: true } } },
            },
          },
        },
      },
    });
    if (!existingProject || existingProject.users[0].userId != userId) {
      throw new ForbiddenException('User not found');
    }
    await this.prisma.user_Has_Project.delete({
      where: { id: existingProject.users[0].id },
    });
    this.socket.emitUserUpdateProject(
      existingProject.users[0],
      projectId,
      false,
    );
    return { message: 'User kick' };
  }

  async removeByAdmin(projectId: string) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found !');
    }
    await this.prisma.$transaction(async (tPrisma) => {
      await tPrisma.post.deleteMany({
        where: { section: { projectId: existingProject.id } },
      });
      await tPrisma.section.deleteMany({
        where: { projectId: existingProject.id },
      });
      await tPrisma.message.deleteMany({
        where: { projectId: existingProject.id },
      });
      await tPrisma.project.delete({
        where: { id: existingProject.id },
      });
    });

    return { message: 'Project deleted !' };
  }
}
