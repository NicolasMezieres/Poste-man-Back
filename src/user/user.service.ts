import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
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
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  myAccount(user: User) {
    const data = {
      lastName: user.lastName,
      firstName: user.firstName,
      email: user.email,
      username: user.username,
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
    return { message: 'Your account has been updated.' };
  }

  async changePassword(user: User, dto: changePasswordDTO) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: user.id, isActive: true },
      select: { id: true, password: true },
    });

    if (!existingUser) {
      throw new NotFoundException('Compte introuvable');
    }
    const isSamePassword = await argon.verify(
      existingUser.password,
      dto.oldPassword,
    );
    if (!isSamePassword) {
      throw new ForbiddenException('Mot de passe incorrecte');
    }
    const newPassword = await argon.hash(dto.password);
    await this.prisma.user.update({
      where: { id: existingUser.id },
      data: { password: newPassword },
      select: null,
    });
    return { message: 'Mot de passe mis à jour' };
  }

  async deleteAccount(user: User) {
    const existingAccount = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });
    if (!existingAccount) {
      throw new InternalServerErrorException('Contact Support for more help.');
    }
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
    ]);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: false,
        isArchive: true,
      },
    });
    return { message: 'Your account gonna be deleted !' };
  }

  async listUser(query: queryUserList) {
    const take = 10;
    const skip = pagination(query.page, take);
    const search = query.search ?? '';
    const countUser = await this.prisma.user.count({
      where: {
        OR: [
          { email: { contains: search } },
          { username: { contains: search } },
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
          OR: [
            { email: { contains: search } },
            { username: { contains: search } },
          ],
        },
        omit: {
          iconId: true,
          roleId: true,
          isArchive: true,
          activateToken: true,
          password: true,
        },
      }),
      isNextPage: nextPage,
    };
  }

  async banUser(user: User, id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.update({
      where: {
        id: id,
      },
      data: {
        isActive: false,
        isArchive: true,
      },
    });
    return { message: 'User has been banned' };
  }

  async deleteUser(user: User, id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.delete({
      where: {
        id: id,
      },
    });
    return { message: 'User has been deleted' };
  }
}
