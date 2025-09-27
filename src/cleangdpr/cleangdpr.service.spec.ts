// cleangdpr.service.spec.ts
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { subYears } from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';
import { CleangdprService } from './cleangdpr.service';
import {
  mockPrismaService,
  mockUpdateMany,
} from './mock/cleangdpr.service.mock';

describe('CleangdprService', () => {
  let service: CleangdprService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleangdprService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CleangdprService>(CleangdprService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should update users with GDPR flag older than 1 year', async () => {
    const mockDate = new Date('2025-09-27T12:00:00Z');
    const expectedCutoffDate = subYears(mockDate, 1);

    jest.useFakeTimers().setSystemTime(mockDate);

    mockUpdateMany.mockResolvedValue({ count: 5 });

    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => {});

    await service.handleGdprUpdate();

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        gdpr: true,
        createdAt: {
          lt: expectedCutoffDate,
        },
      },
      data: {
        gdpr: false,
      },
    });

    expect(logSpy).toHaveBeenCalledWith('Maj GDPR');
    expect(logSpy).toHaveBeenCalledWith('5 user found update gdpr on false');

    jest.useRealTimers();
  });
});
