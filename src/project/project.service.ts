import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/prisma/generated';
import { PrismaService } from 'src/prisma/prisma.service';
import { role, roleProject } from 'src/utils/enum';
import { isEndList } from 'src/utils/function';
import {
  queryPage,
  querySearchAdminProject,
  querySearchProject,
  UserWithRole,
} from 'src/utils/type';
import { projectDTO } from './dto';
import { ProjectGateway } from './project.gateway';
import { PostGateway } from 'src/post/post.gateway';
import { MessageGateway } from 'src/message/message.gateway';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ProjectGateway))
    private socket: ProjectGateway,
    private socketPost: PostGateway,
    private socketMessage: MessageGateway,
  ) {}
  async search(query: querySearchProject, user: User) {
    const take = 10;
    const skip =
      Number(query.page) - 1 <= 0 || isNaN(Number(query.page))
        ? 0
        : (Number(query.page) - 1) * take;
    const whereData = {
      name: { contains: query?.search },
      users: { some: { userId: user.id, isBanned: false } },
      isArchive: false,
    };
    const countProject = await this.prisma.project.count({
      where: whereData,
    });
    const listProject = await this.prisma.project.findMany({
      where: whereData,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      skip,
      take,
    });
    return {
      data: listProject,
      total: countProject,
      isEndList: isEndList(skip, take, countProject),
      user: { username: user.username },
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
        isArchive: true,
        updatedAt: true,
        users: {
          where: { role: { name: roleProject.MODERATOR } },
          select: { user: { select: { username: true } } },
        },
        section: { select: { _count: { select: { post: true } } } },
        _count: { select: { users: true, section: true } },
      },
      skip,
      take,
    });
    const dataProject = listProject.map((project) => {
      return {
        id: project.id,
        name: project.name,
        username: project.users[0].user.username,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        isArchive: project.isArchive,
        totalUser: project._count.users,
        totalSection: project._count.section,
        totalPost: project.section.reduce(
          (total, currentValue) => total + currentValue._count.post,
          0,
        ),
      };
    });
    return {
      data: dataProject,
      total: countProject,
      isEndList: isEndList(skip, take, countProject),
    };
  }

  async getProject(projectId: string, user: UserWithRole) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Projet introuvable !');
    }
    const isAdmin = user.role.name === role.ADMIN;
    const didUserInProject = await this.prisma.user_Has_Project.findFirst({
      where: {
        userId: user.id,
        projectId: existingProject.id,
        isBanned: false,
      },
      select: { role: { select: { name: true } } },
    });
    if (!isAdmin && !didUserInProject) {
      throw new ForbiddenException('Vous ne faites pas partie de ce projet !');
    }
    const isModerator = didUserInProject?.role.name === roleProject.MODERATOR;
    return { projectName: existingProject.name, isModerator, isAdmin };
  }
  async getDetail(projectId: string) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        _count: { select: { section: true } },
        updatedAt: true,
        createdAt: true,
        name: true,
        isArchive: true,
      },
    });
    if (!existingProject) {
      throw new NotFoundException('Projet introuvable !');
    }
    const existingAuthor = await this.prisma.user_Has_Project.findFirst({
      where: {
        projectId: existingProject.id,
        role: { name: roleProject.MODERATOR },
      },
      select: { user: { select: { username: true } } },
    });
    if (!existingAuthor) {
      throw new NotFoundException('Auteur introuvable!');
    }
    const totalPost = await this.prisma.post.count({
      where: { section: { projectId: existingProject.id } },
    });
    const data = {
      author: existingAuthor.user.username,
      totalPost,
      totalSection: existingProject._count.section,
      updatedAt: existingProject.updatedAt,
      createdAt: existingProject.createdAt,
      projectName: existingProject.name,
    };
    return { data };
  }
  async listMember(projectId: string, user: UserWithRole) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Projet introuvable !');
    }
    const listMember = await this.prisma.user_Has_Project.findMany({
      where: {
        projectId: existingProject.id,
      },
      select: {
        userId: true,
        user: {
          select: { username: true, icon: true },
        },
        isBanned: true,
      },
    });
    const didUserInProject = listMember.some(
      (member) => member.userId === user.id && member.isBanned === false,
    );
    const isAdmin = user.role.name === role.ADMIN;
    if (!didUserInProject && !isAdmin) {
      throw new ForbiddenException("Vous n'êtes pas autorisé !");
    }
    return { data: listMember, projectId };
  }

  async create(dto: projectDTO, user: User) {
    const moderatorRole = await this.prisma.role_Project.findUnique({
      where: { name: roleProject.MODERATOR },
      select: { id: true },
    });
    if (!moderatorRole) {
      throw new NotFoundException('Rôle du projet introuvable !');
    }
    const newProject = await this.prisma.project.create({
      data: { name: dto.name },
      select: { id: true },
    });

    const idProject = await this.prisma.user_Has_Project.create({
      data: {
        userId: user.id,
        projectId: newProject.id,
        roleProjectId: moderatorRole.id,
      },
      select: { projectId: true },
    });
    return { message: 'Projet créé !', data: idProject };
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
      throw new NotFoundException('Projet introuvable !');
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
    return { message: 'Lien créé !', data: link };
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
      throw new NotFoundException('Lien invalide !');
    } else if (existingLink.outdatedAt < new Date()) {
      throw new ForbiddenException('Lien expiré !');
    } else if (
      existingLink.projet.users.some(
        (userProject) => userProject.userId === user.id,
      )
    ) {
      throw new ForbiddenException('Vous êtes déjà dans le projet !');
    }
    const memberRole = await this.prisma.role_Project.findUnique({
      where: { name: roleProject.MEMBER },
      select: { id: true },
    });
    if (!memberRole) {
      throw new NotFoundException('Rôle introuvable !');
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
            select: { username: true, icon: true },
          },
        },
      }),
      this.prisma.link_Project.update({
        where: { id: linkId },
        data: { numberUsage: { decrement: 1 } },
        select: null,
      }),
    ]);

    this.socket.emitUserUpdateProject(userMember, existingLink.projet.id, true);
    return {
      message: `Bienvenue à ${existingLink.projet.name} !`,
      projectId: existingLink.projet.id,
    };
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
      throw new ForbiddenException("Vous n'êtes pas autorisé");
    }
    const existingMember = await this.prisma.user_Has_Project.findFirst({
      where: {
        userId: userId,
        projectId: projectId,
        role: { name: { not: roleProject.MODERATOR } },
      },
      select: { id: true, isBanned: true, userId: true, projectId: true },
    });
    if (!existingMember) {
      throw new NotFoundException('Membre introuvable !');
    }
    await this.prisma.$transaction([
      this.prisma.user_Has_Project.update({
        where: { id: existingMember.id },
        data: { isBanned: !existingMember.isBanned },
      }),
      this.prisma.post.updateMany({
        where: {
          userId: existingMember.userId,
          section: { projectId: existingMember.projectId },
        },
        data: { isVisible: existingMember.isBanned },
      }),
      this.prisma.message.updateMany({
        where: {
          projectId: existingMember.projectId,
          authorId: existingMember.userId,
        },
        data: { isVisible: existingMember.isBanned },
      }),
    ]);
    this.socketPost.emitUpdateManyPost(
      existingMember.userId,
      existingMember.projectId,
      existingMember.isBanned,
    );
    this.socket.emitUserBanned(
      existingMember.userId,
      existingMember.projectId,
      !existingMember.isBanned,
    );
    this.socketMessage.emitMessageBan(
      existingMember.userId,
      existingMember.projectId,
      existingMember.isBanned,
    );
    return { message: 'Status mis à jour !' };
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
      throw new NotFoundException('Projet introuvable !');
    }
    await this.prisma.project.update({
      where: { id: existingModerator.projectId },
      data: { ...dto },
      select: null,
    });
    return { message: 'Project modifié !' };
  }

  async remove(projectId: string, user: UserWithRole) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Projet introuvable !');
    }
    const didUserInProject = await this.prisma.user_Has_Project.findFirst({
      where: {
        userId: user.id,
        projectId,
        isBanned: false,
      },
      select: { id: true, role: { select: { name: true } } },
    });
    const isAdmin = user.role.name === role.ADMIN;
    if (!isAdmin && !didUserInProject) {
      throw new ForbiddenException("Vous n'êtes pas autorisé !");
    }
    const isModerator = didUserInProject?.role.name === roleProject.MODERATOR;
    if (isModerator || isAdmin) {
      await this.prisma.$transaction(async (tPrisma) => {
        await tPrisma.post.updateMany({
          where: { section: { projectId: existingProject.id } },
          data: { isArchive: true },
        });
        await tPrisma.section.updateMany({
          where: { projectId: existingProject.id },
          data: { isArchive: true },
        });
        await tPrisma.message.updateMany({
          where: { projectId: existingProject.id },
          data: { isArchive: true },
        });
        await tPrisma.project.update({
          where: { id: existingProject.id },
          data: {
            isArchive: true,
          },
        });
      });
      return { message: 'Projet supprimé !' };
    } else {
      await this.prisma.user_Has_Project.delete({
        where: { id: didUserInProject?.id },
      });
      return { message: 'Projet quitté !' };
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
              select: { username: true, icon: true },
            },
          },
        },
      },
    });
    if (!existingProject) {
      throw new ForbiddenException('Utilisateur introuvable');
    }
    await this.prisma.user_Has_Project.delete({
      where: { id: existingProject.users[0].id },
    });
    this.socketPost.emitKickUser(existingProject.users[0].id, projectId);
    this.socketMessage.emitMessageKick(existingProject.users[0].id, projectId);
    this.socket.emitUserUpdateProject(
      existingProject.users[0],
      projectId,
      false,
    );
    return { message: 'Utilisateur exclu' };
  }
  async getProjectListByUser(userId: string, query: queryPage) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existingUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    const take = 10;
    const skip =
      Number(query.page) - 1 <= 0 || isNaN(Number(query.page))
        ? 0
        : (Number(query.page) - 1) * take;
    const totalProject = await this.prisma.project.count({
      where: { users: { some: { userId: existingUser.id } } },
    });
    if (totalProject === 0) {
      return { data: [], totalProject: 0, isEndList: true };
    }
    const listProject = await this.prisma.project.findMany({
      take,
      skip,
      where: { users: { some: { userId: existingUser.id } } },
      select: {
        _count: { select: { section: true, users: true } },
        users: {
          where: { role: { name: roleProject.MODERATOR } },
          select: { user: { select: { username: true } } },
        },
        name: true,
        createdAt: true,
        updatedAt: true,
        id: true,
        section: { select: { _count: { select: { post: true } } } },
      },
    });
    const data = listProject.map((project) => {
      return {
        name: project.name,
        moderator: project.users[0].user.username,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        id: project.id,
        totalMember: project._count.users,
        totalSection: project._count.section,
        totalPost: project.section.reduce(
          (total, currentValue) => total + currentValue._count.post,
          0,
        ),
      };
    });

    return {
      data,
      isEndList: isEndList(skip, take, totalProject),
      totalProject,
    };
  }
}
