import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/prisma/generated';
import { PrismaService } from 'src/prisma/prisma.service';
import { isNextPage, pagination } from 'src/utils/pagination';
import { updateAccountDTO } from './dto';
import { queryUserList } from 'src/utils/type';
import { changePasswordDTO } from './dto/change.password.dto';
import * as argon from 'argon2';
import { roleProject } from 'src/utils/enum';
import { changeAvatarDTO } from './dto/change.avatar.dto';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  myAccount(user: User) {
    const data = {
      lastName: user.lastName,
      firstName: user.firstName,
      email: user.email,
      username: user.username,
      icon: user.icon,
    };
    return { data };
  }

  async updateAccount(user: User, dto: updateAccountDTO) {
    if (user.email !== dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { email: true },
      });
      if (existingEmail) {
        throw new ForbiddenException('Email déjà utilisé');
      }
    }
    if (user.username !== dto.username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
        select: { username: true },
      });
      if (existingUsername) {
        throw new ForbiddenException('Pseudonyme déjà utilisé');
      }
    }
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        ...dto,
      },
      select: null,
    });
    return { message: 'Compte modifié !' };
  }

  async changePassword(user: User, dto: changePasswordDTO) {
    const isSamePassword = await argon.verify(user.password, dto.oldPassword);
    if (!isSamePassword) {
      throw new ForbiddenException('Mot de passe incorrecte');
    }
    const newPassword = await argon.hash(dto.password);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: newPassword },
      select: null,
    });
    return { message: 'Mot de passe mis à jour' };
  }

  async deleteAccount(user: User) {
    await this.prisma.$transaction([
      this.prisma.post.updateMany({
        where: { userId: user.id },
        data: { isArchive: true },
      }),
      this.prisma.section.updateMany({
        where: {
          project: {
            users: {
              some: {
                userId: user.id,
                role: { name: roleProject.MODERATOR },
              },
            },
          },
        },
        data: { isArchive: true },
      }),
      this.prisma.message.updateMany({
        where: {
          OR: [
            { user: { id: user.id } },
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
        data: { isArchive: true },
      }),
      this.prisma.project.updateMany({
        where: {
          users: {
            some: { userId: user.id, role: { name: roleProject.MODERATOR } },
          },
        },
        data: { isArchive: true },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          isActive: false,
          isArchive: true,
        },
      }),
    ]);
    return { message: 'Compte supprimé !' };
  }

  async listUser(query: queryUserList) {
    const take = 10;
    const skip =
      Number(query.page) - 1 <= 0 || isNaN(Number(query.page))
        ? 0
        : (Number(query.page) - 1) * take;
    const search = query.search ?? '';
    const isActive =
      query.isActive === 'true'
        ? true
        : query.isActive === 'false'
          ? false
          : null;
    const countUser = await this.prisma.user.count({
      where: {
        AND: [
          isActive !== null ? { isActive } : {},
          {
            OR: [
              { email: { contains: search } },
              { username: { contains: search } },
            ],
          },
        ],
      },
    });
    const nextPage = isNextPage(
      countUser,
      pagination(Number(query.page) + 1, take),
    );
    return {
      data: await this.prisma.user.findMany({
        skip: skip,
        take: take,
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          AND: [
            isActive !== null ? { isActive } : {},
            {
              OR: [
                { email: { contains: search } },
                { username: { contains: search } },
              ],
            },
          ],
        },
        select: {
          id: true,
          email: true,
          username: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      totalUser: countUser,
      isNextPage: nextPage,
    };
  }

  async banUser(user: User, id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
      select: { id: true, isActive: true },
    });
    if (!existingUser) {
      throw new NotFoundException('Utilisateur introuvable !');
    }
    await this.prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        isActive: !existingUser.isActive,
      },
    });
    return {
      message: existingUser.isActive
        ? "L'utilisateur à été banni"
        : "L'utilisateur à été débanni",
    };
  }

  async deleteUser(user: User, id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    if (!existingUser) {
      throw new NotFoundException('Utilisateur introuvable !');
    }
    await this.prisma.$transaction([
      this.prisma.post.updateMany({
        where: { userId: existingUser.id },
        data: { isArchive: true },
      }),
      this.prisma.section.updateMany({
        where: {
          project: {
            users: {
              some: {
                userId: existingUser.id,
                role: { name: roleProject.MODERATOR },
              },
            },
          },
        },
        data: { isArchive: true },
      }),
      this.prisma.message.updateMany({
        where: {
          OR: [
            { user: { id: existingUser.id } },
            {
              project: {
                users: {
                  some: {
                    userId: existingUser.id,
                    role: { name: roleProject.MODERATOR },
                  },
                },
              },
            },
          ],
        },
        data: { isArchive: true },
      }),
      this.prisma.project.updateMany({
        where: {
          users: {
            some: {
              userId: existingUser.id,
              role: { name: roleProject.MODERATOR },
            },
          },
        },
        data: { isArchive: true },
      }),
      this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          isActive: false,
          isArchive: true,
        },
      }),
    ]);
    return { message: 'Utilisateur supprimé !' };
  }
  async changeAvatar(user: User, dto: changeAvatarDTO) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { icon: dto.icon },
    });
    return { message: 'Avatar modifié' };
  }
  async detailUser(userId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        gdpr: true,
        createdAt: true,
        updatedAt: true,
        username: true,
      },
    });
    if (!existingUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return { data: existingUser };
  }
}
