import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CronService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_WEEKEND)
  async clearArchive() {
    const countPostDeleted = await this.prisma.post.deleteMany({
      where: { OR: [{ isArchive: true }, { section: { isArchive: true } }] },
    });
    this.logger.log(`${countPostDeleted.count} post archiver supprimer`);
    const countSectionDeleted = await this.prisma.section.deleteMany({
      where: { isArchive: true },
    });
    this.logger.log(`${countSectionDeleted.count} section supprimer`);
    const countMessageDeleted = await this.prisma.message.deleteMany({
      where: { isArchive: true },
    });
    this.logger.log(`${countMessageDeleted.count} message(s) supprimée(s)`);
    const countProjectDelete = await this.prisma.project.deleteMany({
      where: { isArchive: true },
    });
    this.logger.log(`${countProjectDelete.count} projet supprimer`);
    const countAccountDelete = await this.prisma.user.deleteMany({
      where: { isArchive: true },
    });
    this.logger.log(`${countAccountDelete.count} compte supprimer`);
  }


  @Cron(CronExpression.EVERY_WEEKEND)
  async handleLinkProject() {
    const now = new Date();
    const result = await this.prisma.link_Project.deleteMany({
      where: { outdatedAt: { lt: now } },
    });
    if (result.count > 0) {
      this.logger.log(`${result.count} lien(s) expiré(s) supprimé(s)`);
    }
  }
}
