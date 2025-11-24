import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/prisma/generated/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { isNextPage, pagination } from 'src/utils/pagination';
import { updateAccountDTO } from './dto';
import { queryUserList } from 'src/utils/type';

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
    const existingAccount = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!existingAccount) {
      throw new InternalServerErrorException('Contact Support for more help.');
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

  async deleteAccount(user: User) {
    const existingAccount = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });
    if (!existingAccount) {
      throw new InternalServerErrorException('Contact Support for more help.');
    }
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
