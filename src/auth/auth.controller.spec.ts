import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  messageMock,
  resMock,
  signinResponseMock,
  signupMessageMock,
  userMock,
  userWithRoleMock,
} from './mock/auth.mock';
import { AuthServiceMock } from './mock/auth.service.mock';

describe('AuthController', () => {
  let authController: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: AuthServiceMock }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('signup', () => {
    it('should return a message', async () => {
      const dto = {
        firstName: 'test',
        lastName: 'test',
        username: 'test',
        email: 'example@example.com',
        password: 'StrongP@ssword123',
      };
      await expect(authController.signup(dto)).resolves.toEqual(
        signupMessageMock,
      );
    });
  });
  describe('activateAccount', () => {
    it('should return a message', async () => {
      const token = 'token';
      await expect(authController.activationAccount(token)).resolves.toEqual(
        messageMock,
      );
    });
  });
  describe('signin', () => {
    it('should return a message', async () => {
      const dto = {
        identifier: 'test',
        password: 'StrongP@ssword123',
      };
      await expect(authController.signin(dto, resMock)).resolves.toEqual(
        signinResponseMock,
      );
    });
  });
  describe('forgetPassword', () => {
    it('should return a message', async () => {
      const dto = { email: 'example@example.com' };
      await expect(authController.forgetPassword(dto)).resolves.toEqual(
        messageMock,
      );
    });
  });
  describe('resetPassword', () => {
    it('should return a message', async () => {
      const dto = { password: 'StrongP@ssword123' };
      await expect(
        authController.resetPassword(userMock, dto),
      ).resolves.toEqual(messageMock);
    });
  });

  describe('logout', () => {
    it('should return a { message: "Deconnection réussi"', () => {
      const clearCookie = jest.fn();
      const res = { clearCookie } as unknown as Response;
      const result = authController.logout(res);

      expect(clearCookie).toHaveBeenCalledWith('access_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      expect(result).toEqual({ message: 'Deconnection réussi' });
    });
  });
  describe('resetPassword With Token', () => {
    it('should return a message', async () => {
      const dto = { password: 'StrongP@ssword123' };
      await expect(
        authController.resetPasswordWithToken(userMock, dto),
      ).resolves.toEqual(messageMock);
    });
  });
  describe('Log', () => {
    it('Should return a message', () => {
      expect(authController.log(userWithRoleMock)).toBeDefined();
    });
  });
});
