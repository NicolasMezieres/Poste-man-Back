import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtGuard } from 'src/auth/Guards';
import { mockUserService } from './mock/service.mock';
import { mockUser, mockUserUpdate } from './mock/user.mock';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: (context: ExecutionContext) => true })
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  describe('myAsset', () => {
    it('should return user account data', async () => {
      const excepted = { username: 'Plopiplop' };
      mockUserService.myAccount.mockResolvedValue(excepted);

      const result = await controller.myAsset(mockUser);
      expect(result).toEqual(excepted);
      expect(service.myAccount).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('updateAsset', () => {
    it('should call service.updateAccount with user and dto', async () => {
      const dto = mockUserUpdate;
      const excepted = { message: 'Your account has been updated.' };
      mockUserService.updateAccount.mockResolvedValue(excepted);

      const result = await controller.updateAsset(mockUser, dto);
      expect(result).toEqual(excepted);
      expect(service.updateAccount).toHaveBeenCalledWith(mockUser, dto);
    });
  });

  describe('deleteAccount', () => {
    it('should call service.deleteAccount and return message', async () => {
      const expected = { message: 'Your account gonna be deleted !' };
      mockUserService.deleteAccount.mockResolvedValue(expected);

      const result = await controller.deleteAccount(mockUser);
      expect(result).toEqual(expected);
      expect(service.deleteAccount).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('searchUser', () => {
    it('should call listUser with query params', async () => {
      const query = { page: 1, search: 'P' };
      const expected = {
        data: [{ username: 'Plopiplop' }],
        isNextPage: false,
      };
      mockUserService.listUser.mockResolvedValue(expected);
      const result = await controller.searchUser(query);
      expect(result).toEqual(expected);
      expect(service.listUser).toHaveBeenCalledWith(query);
    });
  });

  describe('banUser', () => {
    it('should call banUser with user and id', async () => {
      const id = mockUser.id;
      const excepted = { message: 'User has been banned' };
      mockUserService.banUser.mockResolvedValue(excepted);
      const result = await controller.banUser(mockUser, id);
      expect(result).toEqual(excepted);
      expect(service.banUser).toHaveBeenCalledWith(mockUser, id);
    });
  });

  describe('deleteUser', () => {
    it('should call deelteUser with user and id', async () => {
      const id = mockUser.id;
      const excepted = { message: 'User has been deleted' };
      mockUserService.deleteUser.mockResolvedValue(excepted);

      const result = await controller.deleteUser(mockUser, id)
      expect(result).toEqual(excepted);
      expect(service.deleteUser).toHaveBeenCalledWith(mockUser, id)
    });
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
