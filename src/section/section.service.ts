import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/prisma/generated';
import { PrismaService } from 'src/prisma/prisma.service';
import { role, roleProject } from 'src/utils/enum';
import { createDTO, updateDTO } from './dto';
import { UserWithRole } from 'src/utils/type';

@Injectable()
export class SectionService {
  constructor(private prisma: PrismaService) {}
  async sections(projectId: string, user: UserWithRole) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, section: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found !');
    }
    const didUserInProject = await this.prisma.user_Has_Project.findFirst({
      where: {
        userId: user.id,
        projectId: existingProject.id,
        isBanned: false,
      },
      select: { id: true },
    });
    const isAdmin = user.role.name === role.ADMIN;
    if (!didUserInProject && !isAdmin) {
      throw new ForbiddenException('You are unauthorized !');
    }
    return { data: existingProject.section };
  }

  async createSection(dto: createDTO, projectId: string, user: User) {
    const existingUserProject = await this.prisma.user_Has_Project.findFirst({
      where: {
        projectId: projectId,
        userId: user.id,
        role: { name: roleProject.MODERATOR },
      },
      select: { id: true },
    });
    if (!existingUserProject) {
      throw new ForbiddenException('Project doenst exist');
    }
    const existingSection = await this.prisma.section.findFirst({
      where: { name: dto.name, project: { id: projectId } },
      select: { id: true },
    });
    if (existingSection) {
      throw new BadRequestException('This name is already used');
    }
    await this.prisma.section.create({
      data: {
        name: dto.name,
        projectId: projectId,
      },
      select: null,
    });
    return { message: 'Section create' };
  }

  async updateSection(
    dto: updateDTO,
    projectId: string,
    sectionId: string,
    user: User,
  ) {
    const existingSection = await this.prisma.section.findFirst({
      where: {
        id: sectionId,
        project: {
          id: projectId,
          users: {
            some: { userId: user.id, role: { name: roleProject.MODERATOR } },
          },
        },
      },
      select: { id: true, projectId: true },
    });
    if (!existingSection) {
      throw new BadRequestException('Not found section');
    }
    const isSameNameSection = await this.prisma.section.findFirst({
      where: { projectId: existingSection.projectId, name: dto.name },
      select: { id: true },
    });
    if (isSameNameSection) {
      throw new ForbiddenException('This name is already used');
    }
    await this.prisma.section.update({
      where: { id: existingSection.id },
      data: {
        name: dto.name,
      },
      select: null,
    });
    return { message: 'Section Update' };
  }

  async removeSection(sectionId: string, user: UserWithRole) {
    const existingSection = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { id: true, projectId: true },
    });
    if (!existingSection) {
      throw new NotFoundException('Section not found !');
    }
    const isAdmin = user.role.name === role.ADMIN;
    if (!isAdmin) {
      const isModerator = await this.prisma.user_Has_Project.findFirst({
        where: {
          userId: user.id,
          projectId: existingSection.projectId,
          role: { name: roleProject.MODERATOR },
        },
        select: { id: true },
      });
      if (!isModerator) {
        throw new ForbiddenException('You are unauthorized !');
      }
    }
    await this.prisma.section.delete({
      where: { id: sectionId },
      select: null,
    });
    return { message: 'Section has been deleted' };
  }
}
