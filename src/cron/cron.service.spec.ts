import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { CronService } from './cron.service';
import { mockLogger } from './mock/cron.logger.mock';
import { mockPrismaService } from './mock/cron.service.mock';

describe('CronService', () => {
  let service: CronService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<CronService>(CronService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });
  describe('clear Archive', () => {
    it('Should clear post,section,message,project,account archived', async () => {
      mockPrismaService.post.deleteMany.mockReturnValue({ count: 3 });
      mockPrismaService.section.deleteMany.mockReturnValue({ count: 5 });
      mockPrismaService.message.deleteMany.mockReturnValue({ count: 1 });
      mockPrismaService.project.deleteMany.mockReturnValue({ count: 3 });
      mockPrismaService.user.deleteMany.mockReturnValue({ count: 2 });
      await service.clearArchive();
      expect(prisma.post.deleteMany).toHaveBeenCalledWith({
        where: { OR: [{ isArchive: true }, { section: { isArchive: true } }] },
      });
      expect(prisma.section.deleteMany).toHaveBeenCalledWith({
        where: { isArchive: true },
      });
      expect(prisma.message.deleteMany).toHaveBeenCalledWith({
        where: { isArchive: true },
      });
      expect(prisma.project.deleteMany).toHaveBeenCalledWith({
        where: { isArchive: true },
      });
      expect(prisma.user.deleteMany).toHaveBeenCalledWith({
        where: { isArchive: true },
      });
    });
  });
  describe('handleLinkProject', () => {
    it('should delete outdated links and log when count > 0', async () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);
      mockPrismaService.link_Project.deleteMany.mockResolvedValue({ count: 2 });

      await service.handleLinkProject();

      expect(prisma.link_Project.deleteMany).toHaveBeenCalledWith({
        where: { outdatedAt: { lt: now } },
      });
      expect(mockLogger.log).toHaveBeenCalledWith(
        '2 lien(s) expiré(s) supprimé(s)',
      );
    });
    it('should not log when no link is deleted', async () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);
      mockPrismaService.link_Project.deleteMany.mockResolvedValue({ count: 0 });

      await service.handleLinkProject();

      expect(prisma.link_Project.deleteMany).toHaveBeenCalledWith({
        where: { outdatedAt: { lt: now } },
      });
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
