import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { mockPrisma } from './mock/prisma.mock';
import { mockUser, mockUserUpdate } from './mock/user.mock';
import { UserService } from './user.service';

jest.mock('src/utils/pagination.ts', () => ({
  pagination: jest.fn().mockReturnValue(0),
  isNextPage: jest.fn().mockReturnValue(false),
}));
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('updatedAccount', () => {
    it('should update user and return sucess message', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(undefined);

      const dto = mockUserUpdate;
      const result = await service.updateAccount(mockUser, dto);

      expect(result).toEqual({ message: 'Your account has been updated.' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: dto,
        select: null,
      });
    });
  });

  it('should throw InternalServerErrorExeption if user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.updateAccount(mockUser, {
        firstName: '',
        lastName: '',
        username: '',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
  describe('MyAccount', () => {
    it('shoudl return existing account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ username: 'Plopiplop' });

      const result = await service.myAccount(mockUser);
      expect(result).toEqual({ username: 'Plopiplop' });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { firstName: true, lastName: true, username: true },
      });
    });
    it('should throw ForbiddenException if no account found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.myAccount(mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('deleteAccount', () => {
    it('should desactivate and archive account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(undefined);

      const result = await service.deleteAccount(mockUser);
      expect(result).toEqual({ message: 'Your account gonna be deleted !' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { isActive: false, isArchive: true },
      });
    });
    it('should throw InternalServerErrorException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.deleteAccount(mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('listUser', () => {
    it('should return paginated list of users', async () => {
      mockPrisma.user.count.mockResolvedValue(5);
      mockPrisma.user.findMany.mockResolvedValue([{ username: 'Plopiplop' }]);
      const query = { page: 1, search: 'P' };
      const result = await service.listUser(query);

      expect(result).toEqual({
        data: [{ username: 'Plopiplop' }],
        isNextPage: false,
      });
      expect(mockPrisma.user.count).toHaveBeenCalled();
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe('banUSer', () => {
    it('should ban the user sucessfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(undefined);
      const result = await service.banUser(mockUser, '1');
      expect(result).toEqual({ message: 'User has been banned' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false, isArchive: true },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.banUser(mockUser, 'id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete the user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.delete.mockResolvedValue(undefined);

      const result = await service.deleteUser(mockUser, '1');
      expect(result).toEqual({ message: 'User has been deleted' });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
      });
    });
    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.deleteUser(mockUser, 'id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
