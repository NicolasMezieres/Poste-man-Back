import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CronService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleIsArchiveSection() {
    await this.prisma.post.deleteMany({
      where: { section: { isArchive: true } },
    });
    const result = await this.prisma.section.deleteMany({
      where: {
        isArchive: true,
      },
    });
    this.logger.log(`${result.count} section delete`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleIsArchiveMessage() {
    const result = await this.prisma.message.deleteMany({
      where: {
        isArchive: true,
      },
    });
    this.logger.log(`${result.count} message delete`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleLinkProject() {
    const now = new Date();
    const result = await this.prisma.link_Project.deleteMany({
      where: { outdatedAt: { lt: now } },
    });
    if (result.count > 0) {
      this.logger.log(`${result.count} lien(s) expiré(s) supprimé(s)`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAccountDelete() {
    const result = await this.prisma.user.deleteMany({
      where: {
        isArchive: true,
      },
    });
    this.logger.log(`${result.count} account deleted`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAccountBanned() {
    const result = await this.prisma.user.deleteMany({
      where: {
        isActive: false,
        isArchive: true,
      },
    });
    this.logger.log(`${result.count} account ban deleted`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleProjectDelete() {
    const result = await this.prisma.project.deleteMany({
      where: {
        isArchive: true,
      },
    });
    this.logger.log(`${result.count} project archived deleted`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePostDelete() {
    const result = await this.prisma.post.deleteMany({
      where: { isArchive: true },
    });
    this.logger.log(`${result.count} post archived delete`);
  }
}
