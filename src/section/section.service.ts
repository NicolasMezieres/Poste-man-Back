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
      where: { id: projectId, isArchive: false },
      select: {
        id: true,
        section: { where: { isArchive: false } },
        name: true,
      },
    });
    if (!existingProject) {
      throw new NotFoundException('Projet introuvable !');
    }
    const didUserInProject = await this.prisma.user_Has_Project.findFirst({
      where: {
        userId: user.id,
        projectId: existingProject.id,
        isBanned: false,
      },
      select: { role: { select: { name: true } } },
    });
    const isAdmin = user.role.name === role.ADMIN;

    if (!didUserInProject && !isAdmin) {
      throw new ForbiddenException("Vous n'êtes pas autorisé");
    }
    const isModerator: boolean =
      didUserInProject?.role.name === roleProject.MODERATOR;
    return {
      data: existingProject.section,
      isModerator,
      isAdmin,
      projectName: existingProject.name,
    };
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
      throw new NotFoundException('Projet introuvable');
    }
    const existingSection = await this.prisma.section.findFirst({
      where: { name: dto.name, project: { id: projectId }, isArchive: false },
      select: { id: true },
    });
    if (existingSection) {
      throw new BadRequestException('Ce nom de section est déjà utilisé');
    }
    const newSection = await this.prisma.section.create({
      data: {
        name: dto.name,
        projectId: projectId,
      },
    });
    return { message: 'Section créé', data: newSection };
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
      throw new NotFoundException('Section introuvable');
    }
    const isSameNameSection = await this.prisma.section.findFirst({
      where: { projectId: existingSection.projectId, name: dto.name },
      select: { id: true },
    });
    if (isSameNameSection) {
      throw new ForbiddenException('Ce nom de section est déjà utilisé');
    }
    const sectionUpdated = await this.prisma.section.update({
      where: { id: existingSection.id },
      data: {
        name: dto.name,
      },
    });
    return { message: 'Section modifié', data: sectionUpdated };
  }

  async removeSection(sectionId: string, user: UserWithRole) {
    const existingSection = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { id: true, projectId: true },
    });
    if (!existingSection) {
      throw new NotFoundException('Section introuvable !');
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
        throw new ForbiddenException("Vous n'êtes pas autorisé");
      }
    }
    await this.prisma.post.updateMany({
      where: { sectionId },
      data: { isArchive: true },
    });
    await this.prisma.section.update({
      where: { id: sectionId },
      data: {
        isArchive: true,
      },
      select: null,
    });
    return { message: 'Section supprimé' };
  }
  async removeAllSection(projectId: string, user: UserWithRole) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!existingProject) {
      throw new NotFoundException('Projet introuvable');
    }
    const isAdmin = user.role.name === role.ADMIN;
    if (!isAdmin) {
      const isModerator = await this.prisma.user_Has_Project.findFirst({
        where: {
          projectId: existingProject.id,
          userId: user.id,
          role: { name: roleProject.MODERATOR },
        },
        select: { id: true },
      });
      if (!isModerator) {
        throw new ForbiddenException("Vous n'êtes pas modérateur !");
      }
    }
    await this.prisma.section.updateMany({
      where: { projectId: existingProject.id },
      data: { isArchive: true },
    });
    return { message: 'Sections supprimé avec succes !' };
  }
}
