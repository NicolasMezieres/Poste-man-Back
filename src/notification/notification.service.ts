import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/prisma/generated';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async notifications(user: User) {
    return {
      data: await this.prisma.notification.findMany({
        where: { userId: user.id },
      }),
    };
  }

  async createMany(
    users: { projectId: string; userId: string }[],
    theme: string,
    text: string,
  ) {
    await this.prisma.notification.createMany({
      data: users.map((user) => ({
        ...user,
        theme,
        text,
      })),
      skipDuplicates: true,
    });
    return;
  }

  async remove(id: string, user: User) {
    const isValidId = !Number.isNaN(Number(id));
    if (!isValidId) {
      throw new ForbiddenException('Notification invalide');
    }
    const existingNotification = await this.prisma.notification.findFirst({
      where: { id: Number(id), userId: user.id },
      select: { id: true },
    });
    if (!existingNotification) {
      throw new NotFoundException('Notification introuvable !');
    }
    await this.prisma.notification.delete({
      where: { id: existingNotification.id },
    });
    return { message: 'Notification supprimer !' };
  }
  async removeAll(user: User) {
    await this.prisma.notification.deleteMany({
      where: { userId: user.id },
    });
    return { message: 'Notifications supprimer !' };
  }
}
