import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { mockPrisma } from './mock/prisma.mock';
import { mockUser, mockUserUpdate } from './mock/user.mock';
import { UserService } from './user.service';
import { userMock } from 'src/auth/mock/auth.mock';
import * as argon from 'argon2';
jest.mock('src/utils/pagination.ts', () => ({
  pagination: jest.fn().mockReturnValue(0),
  isNextPage: jest.fn().mockReturnValue(false),
}));
describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('updatedAccount', () => {
    const dto = {
      firstName: 'bidule',
      lastName: 'muche',
      email: 'email@example.com',
      username: 'username',
    };
    it('should update user and return sucess message', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(undefined);
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(null);
      const result = await service.updateAccount(mockUser, mockUserUpdate);

      expect(result).toEqual({ message: 'Your account has been updated.' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: mockUserUpdate,
        select: null,
      });
    });
    it('Should fail email already used', async () => {
      jest
        .spyOn(mockPrisma.user, 'findUnique')
        .mockResolvedValue({ something: true });
      await expect(service.updateAccount(userMock, dto)).rejects.toEqual(
        new ForbiddenException('Email déjà utilisé'),
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
    it('Should fail username already used', async () => {
      jest
        .spyOn(mockPrisma.user, 'findUnique')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ something: true });
      await expect(service.updateAccount(userMock, dto)).rejects.toEqual(
        new ForbiddenException('Pseudonyme déjà utilisé'),
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const dto = { oldPassword: 'oldPassword', password: 'password' };
    it('Should fail, password incorrect', async () => {
      jest
        .spyOn(mockPrisma.user, 'findUnique')
        .mockReturnValue({ id: 'id', password: 'oldPassword' });
      jest.spyOn(argon, 'verify').mockResolvedValue(false);
      await expect(service.changePassword(userMock, dto)).rejects.toEqual(
        new ForbiddenException('Mot de passe incorrecte'),
      );
    });
    it('Should succes password updated', async () => {
      jest
        .spyOn(mockPrisma.user, 'findUnique')
        .mockReturnValue({ id: 'id', password: 'oldPassword' });
      jest.spyOn(argon, 'verify').mockResolvedValue(true);
      jest.spyOn(argon, 'hash');
      jest.spyOn(mockPrisma.user, 'update').mockReturnValue(null);
      await expect(service.changePassword(userMock, dto)).resolves.toEqual({
        message: 'Mot de passe mis à jour',
      });
    });
  });

  describe('MyAccount', () => {
    it('should return data of my account', () => {
      const data = {
        email: userMock.email,
        firstName: userMock.firstName,
        lastName: userMock.lastName,
        username: userMock.username,
        icon: null,
      };
      const result = service.myAccount(userMock);
      expect(result).toEqual({ data });
    });
  });

  describe('deleteAccount', () => {
    it('should desactivate and archive account', async () => {
      mockPrisma.user.update.mockResolvedValue(undefined);
      mockPrisma.post.updateMany.mockResolvedValue(undefined);
      mockPrisma.section.updateMany.mockResolvedValue(undefined);
      mockPrisma.message.updateMany.mockResolvedValue(undefined);
      mockPrisma.project.updateMany.mockResolvedValue(undefined);
      mockPrisma.$transaction.mockResolvedValue(undefined);
      const result = await service.deleteAccount(mockUser);
      expect(result).toEqual({ message: 'Your account gonna be deleted !' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { isActive: false, isArchive: true },
      });
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
        totalUser: 5,
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
      expect(result).toEqual({ message: "L'utilisateur à été banni" });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
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
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
        data: { isActive: false, isArchive: true },
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
  describe('changeAvatar', () => {
    it('Should change avatar', async () => {
      mockPrisma.user.update.mockResolvedValue(null);
      await expect(
        service.changeAvatar(mockUser, { icon: 'cat' }),
      ).resolves.toEqual({ message: 'Avatar modifié' });
    });
  });
});
