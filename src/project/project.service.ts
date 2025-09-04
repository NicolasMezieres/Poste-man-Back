import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { projectDTO } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { roleProject } from 'src/utils/enum';
import { isEndList } from 'src/utils/const';
export type querySearchProject = {
  page: number;
  search: string;
};
type querySearchAdminProject = {
  page: number;
  search: string;
  from: string;
  to: string;
};

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}
  //todo: rajouter l'utilisateur jwt
  async getProject(projectId: string) {
    const existingProject = await this.prisma.user_Has_Project.findFirst({
      where: { userId: 'userId', projectId: projectId, isBanned: false },
      select: null,
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found !');
    }
    return { message: 'nothing' };
  }
  async search(query: querySearchProject) {
    const take = 10;
    const skip =
      Number(query.page) - 1 <= 0 || isNaN(Number(query.page))
        ? 0
        : (Number(query.page) - 1) * take;
    const countProject = await this.prisma.user_Has_Project.count({
      where: { userId: 'userId', isBanned: false },
    });
    const listProject = await this.prisma.user_Has_Project.findMany({
      where: { userId: 'userId', isBanned: false },
      select: { project: { select: { id: true, name: true } } },
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
    const countProject = await this.prisma.user_Has_Project.count({
      where: {
        userId: query?.search,
        project: {
          name: query?.search,
          updatedAt: { gte: new Date(), lte: new Date() },
        },
      },
    });
    const listProject = await this.prisma.user_Has_Project.findMany({
      where: { userId: 'userId', isBanned: false },
      select: { project: { select: { id: true, name: true } } },
      skip,
      take,
    });
    return {
      data: listProject,
      total: countProject,
      isEndList: isEndList(skip, take, countProject),
    };
  }
  async create(dto: projectDTO) {
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
        userId: 'userId à modifier',
        projectId: newProject.id,
        roleProjectId: moderatorRole.id,
      },
      select: null,
    });
    return { message: 'Project successfully create !' };
  }
  async createInvitationLink(projectId: string) {
    const existingProject = await this.prisma.user_Has_Project.findFirst({
      where: {
        projectId: projectId,
        userId: 'userId à modifier',
        role: { name: roleProject.MODERATOR },
      },
      select: { id: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found !');
    }
    const link = await this.prisma.link_Project.create({
      data: {
        projectId: existingProject.id,
        outdatedAt: new Date(new Date().getMinutes() + 10),
      },
      select: { id: true, outdatedAt: true },
    });
    return { message: 'Link created !', data: link };
  }

  async joinProject(linkId: string) {
    const existingLink = await this.prisma.link_Project.findFirst({
      where: {
        id: linkId,
        outdatedAt: { gt: new Date() },
        numberUsage: { gt: 0 },
      },
      select: { projectId: true, numberUsage: true },
    });
    if (!existingLink) {
      throw new NotFoundException('Link invalid !');
    }
    const existingUserInProject = await this.prisma.user_Has_Project.findFirst({
      where: { projectId: existingLink.projectId, userId: 'userId' },
      select: { id: true },
    });
    if (existingUserInProject) {
      throw new ForbiddenException('You are already in the project');
    }
    const memberRole = await this.prisma.role_Project.findUnique({
      where: { name: roleProject.MEMBER },
      select: { id: true },
    });
    if (!memberRole) {
      throw new InternalServerErrorException('Role not found !');
    }
    await this.prisma.$transaction([
      this.prisma.user_Has_Project.create({
        data: {
          userId: 'userId',
          projectId: existingLink.projectId,
          roleProjectId: memberRole.id,
        },
        select: null,
      }),
      this.prisma.link_Project.update({
        where: { id: linkId },
        data: { numberUsage: existingLink.numberUsage - 1 },
        select: null,
      }),
    ]);
  }

  async rename(dto: projectDTO, projectId: string) {
    const existingModerator = await this.prisma.user_Has_Project.findFirst({
      where: { id: projectId, userId: 'userId' },
      select: { projectId: true, role: { select: { name: true } } },
    });
    if (!existingModerator) {
      throw new NotFoundException('Project not found !');
    } else if (
      (existingModerator.role.name as roleProject) != roleProject.MODERATOR
    ) {
      throw new ForbiddenException('You are unauthorized 😡');
    }
    await this.prisma.project.update({
      where: { id: existingModerator.projectId },
      data: { ...dto },
      select: null,
    });
    return { message: 'Project modified !' };
  }

  //todo: rajouter l'utilisateur jwt
  async remove(projectId: string) {
    const existingProject = await this.prisma.user_Has_Project.findFirst({
      where: { projectId, userId: 'userId' },
      select: { projectId: true, role: { select: { name: true } } },
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found');
    } else if (
      (existingProject.role.name as roleProject) != roleProject.MODERATOR
    ) {
      throw new ForbiddenException('You are unauthorized 😡');
    }
    await this.prisma.post.deleteMany({
      where: { section: { projectId: existingProject.projectId } },
    });
    await this.prisma.section.deleteMany({
      where: { projectId: existingProject.projectId },
    });
    await this.prisma.message.deleteMany({
      where: { projectId: existingProject.projectId },
    });
    await this.prisma.project.delete({
      where: { id: existingProject.projectId },
    });
    return { message: 'Project deleted !' };
  }
  async removeByAdmin(projectId: string) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found !');
    }
    await this.prisma.post.deleteMany({
      where: { section: { projectId: existingProject.id } },
    });
    await this.prisma.section.deleteMany({
      where: { projectId: existingProject.id },
    });
    await this.prisma.message.deleteMany({
      where: { projectId: existingProject.id },
    });
    await this.prisma.project.delete({
      where: { id: existingProject.id },
    });
    return { message: 'Project deleted !' };
  }
}
