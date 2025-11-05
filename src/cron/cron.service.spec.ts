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

  describe('handleIsArchiveSection', () => {
    it('should delete archived sections and log result', async () => {
      mockPrismaService.section.deleteMany.mockResolvedValue({ count: 3 });
      await service.handleIsArchiveSection();
      expect(prisma.section.deleteMany).toHaveBeenCalledWith({
        where: { isArchive: true },
      });
      expect(mockLogger.log).toHaveBeenCalledWith('3 section delete');
    });
  });

  describe('handleIsArchiveMessage', () => {
    it('should delete archived messages and log result', async () => {
      mockPrismaService.message.deleteMany.mockResolvedValue({ count: 5 });

      await service.handleIsArchiveMessage();

      expect(prisma.message.deleteMany).toHaveBeenCalledWith({
        where: { isArchive: true },
      });
      expect(mockLogger.log).toHaveBeenCalledWith('5 message delete');
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

  describe('handleAccountDelete', () => {
    it('should delete archived users and log result', async () => {
      mockPrismaService.user.deleteMany.mockResolvedValue({ count: 4 });

      await service.handleAccountDelete();

      expect(prisma.user.deleteMany).toHaveBeenCalledWith({
        where: { isArchive: true },
      });
      expect(mockLogger.log).toHaveBeenCalledWith('4 account deleted');
    });
  });
  describe('handleAccountBanned', () => {
    it('should delete banned archived users and log result', async () => {
      mockPrismaService.user.deleteMany.mockResolvedValue({ count: 2 });

      await service.handleAccountBanned();

      expect(prisma.user.deleteMany).toHaveBeenCalledWith({
        where: { isActive: false, isArchive: true },
      });
      expect(mockLogger.log).toHaveBeenCalledWith('2 account ban deleted');
    });
  });
  describe('handleProjectDelete', () => {
    it('should delete archived projects and log result', async () => {
      mockPrismaService.project.deleteMany.mockResolvedValue({ count: 6 });

      await service.handleProjectDelete();

      expect(prisma.project.deleteMany).toHaveBeenCalledWith({
        where: { isArchive: true },
      });
      expect(mockLogger.log).toHaveBeenCalledWith('6 project archived deleted');
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
