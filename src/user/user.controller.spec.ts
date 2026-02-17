import { Test, TestingModule } from '@nestjs/testing';
import { JwtGuard } from 'src/auth/Guards';
import { mockUserService } from './mock/service.mock';
import { mockUser, mockUserUpdate } from './mock/user.mock';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { userMock } from 'src/auth/mock/auth.mock';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  describe('myAccount', () => {
    it('should return user account data', () => {
      const data = {
        email: userMock.email,
        firstName: userMock.firstName,
        lastName: userMock.lastName,
        username: userMock.username,
      };
      jest.spyOn(service, 'myAccount').mockReturnValue({ data });
      expect(controller.myAccount(userMock)).toEqual({ data });
      expect(service.myAccount).toHaveBeenCalled();
    });
  });

  describe('updateAccount', () => {
    it('should call service.updateAccount with user and dto', async () => {
      const dto = mockUserUpdate;
      const excepted = { message: 'Your account has been updated.' };
      mockUserService.updateAccount.mockResolvedValue(excepted);

      const result = await controller.updateAccount(mockUser, dto);
      expect(result).toEqual(excepted);
      expect(service.updateAccount).toHaveBeenCalledWith(mockUser, dto);
    });
  });
  describe('changePassword', () => {
    it('Should call changePassword in service and return message', async () => {
      const message = 'Mot de passe mis à jour';
      const dto = { oldPassword: 'oldPassword', password: 'newPassword' };
      jest.spyOn(service, 'changePassword').mockResolvedValue({ message });
      await expect(controller.changePassword(userMock, dto)).resolves.toEqual({
        message,
      });
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
    it('should call deleteUser with user and id', async () => {
      const id = mockUser.id;
      const excepted = { message: 'User has been deleted' };
      mockUserService.deleteUser.mockResolvedValue(excepted);

      const result = await controller.deleteUser(mockUser, id);
      expect(result).toEqual(excepted);
      expect(service.deleteUser).toHaveBeenCalledWith(mockUser, id);
    });
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('changeAvatar', () => {
    it('Should call changeAvatar in service', async () => {
      jest
        .spyOn(service, 'changeAvatar')
        .mockResolvedValue({ message: 'Avatar modifié' });
      await expect(
        controller.changeAvatar({ icon: 'cat' }, mockUser),
      ).resolves.toEqual({
        message: 'Avatar modifié',
      });
      expect(service.changeAvatar).toHaveBeenCalled();
    });
  });
});
