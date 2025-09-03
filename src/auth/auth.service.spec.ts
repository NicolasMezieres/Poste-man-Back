import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from 'src/email/email.service';
import { HashService } from 'src/hash/hash.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthConfigMock } from './mock/auth.config.mock';
import { AuthEmailMock } from './mock/auth.email.mock';
import { hashMock } from './mock/auth.hash.mock';
import { JwtMock } from './mock/auth.jwt.mock';
import {
  cookieRuleMock,
  resMock,
  roleMock,
  signinResponseMock,
  signupMessageMock,
  tokenMock,
  userMock,
} from './mock/auth.mock';
import { AuthPrismaMock } from './mock/auth.prisma.mock';
import { AuthServiceMock } from './mock/auth.service.mock';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: EmailService, useValue: AuthEmailMock },
        { provide: JwtService, useValue: JwtMock },
        { provide: ConfigService, useValue: AuthConfigMock },
        { provide: PrismaService, useValue: AuthPrismaMock },
        { provide: HashService, useValue: hashMock },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
  describe('signToken', () => {
    it('should return a connexion token', async () => {
      jest.spyOn(JwtMock, 'signAsync').mockResolvedValue('jwtToken');
      jest.spyOn(AuthConfigMock, 'get').mockResolvedValue('jwt secret');
      await expect(AuthServiceMock.signToken(userMock, '1d')).resolves.toEqual({
        connexion_token: 'jwtToken',
      });
    });
  });
  describe('signup', () => {
    const dto = {
      firstName: 'test',
      lastName: 'test',
      username: 'test',
      email: 'example@example.com',
      password: 'StrongP@ssword123',
    };
    it('should return a { message: "Your account as been create !"} ', async () => {
      jest
        .spyOn(AuthPrismaMock.user, 'findUnique')
        .mockResolvedValue(undefined);
      jest
        .spyOn(AuthPrismaMock.user, 'findUnique')
        .mockResolvedValue(undefined);
      jest.spyOn(AuthPrismaMock.role, 'findUnique').mockResolvedValue(roleMock);
      jest
        .spyOn(hashMock, 'hash')
        .mockResolvedValueOnce('hashed password')
        .mockResolvedValueOnce('token hashed');
      jest.spyOn(AuthPrismaMock.user, 'create').mockResolvedValue(userMock);
      jest
        .spyOn(AuthEmailMock, 'accountConfirmation')
        .mockResolvedValue(undefined);

      await expect(authService.signup(dto)).resolves.toEqual(signupMessageMock);
    });
  });
  describe('activateAccount', () => {
    const token = 'token';
    it('should return a { message: "Your account is active !"}', async () => {
      const user = { ...userMock };
      user.activateToken = token;
      jest.spyOn(AuthPrismaMock.user, 'findFirst').mockResolvedValue(userMock);
      jest.spyOn(AuthPrismaMock.user, 'update').mockResolvedValue(userMock);
      await expect(authService.activationAccount(token)).resolves.toEqual({
        message: 'Your account is active !',
      });
    });
    it('should return a { message: "Account not found"}', async () => {
      jest.spyOn(AuthPrismaMock.user, 'findFirst').mockResolvedValue(undefined);
      await expect(authService.activationAccount(token)).rejects.toEqual(
        new NotFoundException('Account not found'),
      );
    });
  });
  describe('signin', () => {
    const dto = {
      identifier: 'example@example.com',
      password: 'StrongP@ssword123',
    };
    it("should return a { message: 'Connexion succesfully', role:'role'}", async () => {
      const dataUser = { ...userMock, role: { name: 'role' } };
      jest.spyOn(AuthPrismaMock.user, 'findFirst').mockResolvedValue(dataUser);
      jest.spyOn(hashMock, 'verify').mockResolvedValue(true);
      jest.spyOn(authService, 'signToken').mockResolvedValue(tokenMock);
      expect(await authService.signin(dto, resMock)).toEqual(
        signinResponseMock,
      );
      expect(resMock.cookie).toHaveBeenCalledWith(
        'access_token',
        tokenMock.connexion_token,
        cookieRuleMock,
      );
    });
    it('should return unauthorized exception Invalid credential', async () => {
      jest.spyOn(AuthPrismaMock.user, 'findFirst').mockResolvedValue(undefined);
      await expect(authService.signin(dto, resMock)).rejects.toEqual(
        new UnauthorizedException('Invalid credential'),
      );
    });
    it('should return unauthorized exception Your account is not activate', async () => {
      const user = { ...userMock };
      user.isActive = false;
      jest.spyOn(AuthPrismaMock.user, 'findFirst').mockResolvedValue(user);
      await expect(authService.signin(dto, resMock)).rejects.toEqual(
        new UnauthorizedException('Your account is not activate'),
      );
    });
    it('should return unauthorized exception Invalid credential', async () => {
      jest.spyOn(AuthPrismaMock.user, 'findFirst').mockResolvedValue(userMock);
      jest.spyOn(hashMock, 'verify').mockResolvedValue(false);
      await expect(authService.signin(dto, resMock)).rejects.toEqual(
        new UnauthorizedException('Invalid credential'),
      );
    });
  });

  describe('forgetPassword', () => {});
  describe('resetPassword', () => {});
});
