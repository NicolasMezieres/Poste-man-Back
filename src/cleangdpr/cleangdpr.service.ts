import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subYears } from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CleangdprService {
  private readonly logger = new Logger(CleangdprService.name);
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_WEEKEND)
  async handleGdprUpdate() {
    const cutoffDate = subYears(new Date(), 1);
    this.logger.log('Checking gdpr users');

    const result = await this.prisma.user.updateMany({
      where: {
        gdpr: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
      data: {
        gdpr: false,
      },
    });
    this.logger.log(`${result.count} user found update status`);
  }
}
