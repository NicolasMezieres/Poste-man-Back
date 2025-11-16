import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon from 'argon2';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthConfigMock } from './mock/auth.config.mock';
import { AuthEmailMock } from './mock/auth.email.mock';
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
      await expect(authService.signToken(userMock, '1d')).resolves.toEqual({
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
        .spyOn(argon, 'hash')
        .mockResolvedValueOnce('hashed password')
        .mockResolvedValueOnce('token hashed');
      jest.spyOn(AuthPrismaMock.user, 'create').mockResolvedValue(userMock);
      jest
        .spyOn(AuthEmailMock, 'accountConfirmation')
        .mockResolvedValue(undefined);
      await expect(authService.signup(dto)).resolves.toEqual(signupMessageMock);
    });
    it('should return a { message: "Username already taken 😱"}', async () => {
      jest.spyOn(AuthPrismaMock.user, 'findUnique').mockResolvedValue(userMock);
      await expect(() => authService.signup(dto)).rejects.toEqual(
        new UnauthorizedException('Username already taken 😱'),
      );
    });
    it('should return a { message: "Email already taken 😱"}', async () => {
      jest
        .spyOn(AuthPrismaMock.user, 'findUnique')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(userMock);
      await expect(() => authService.signup(dto)).rejects.toEqual(
        new UnauthorizedException('Email already taken 😱'),
      );
    });
    it('should return internal servor exception', async () => {
      jest
        .spyOn(AuthPrismaMock.user, 'findUnique')
        .mockResolvedValue(undefined);
      jest
        .spyOn(AuthPrismaMock.role, 'findUnique')
        .mockResolvedValue(undefined);
      await expect(() => authService.signup(dto)).rejects.toEqual(
        new InternalServerErrorException(),
      );
    });
  });
  describe('activateAccount', () => {
    const token = 'token';
    it('should return a { message: "Your account has been created !"}', async () => {
      const user = { ...userMock };
      user.activateToken = token;
      jest.spyOn(AuthPrismaMock.user, 'findFirst').mockResolvedValue(userMock);
      jest.spyOn(AuthPrismaMock.user, 'update').mockResolvedValue(userMock);
      await expect(authService.activationAccount(token)).resolves.toEqual({
        message: 'Your account has been created !',
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
      jest.spyOn(argon, 'verify').mockResolvedValue(true);
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
    //Testunitaire pour quand ca fonctionne pas
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
      jest.spyOn(argon, 'verify').mockResolvedValue(false);
      await expect(authService.signin(dto, resMock)).rejects.toEqual(
        new UnauthorizedException('Invalid credential'),
      );
    });
  });

  //todo finir les test unitaires ci-dessous
  describe('forgetPassword', () => {
    const dto = { email: 'example@example.com' };
    it('should return a { message: "A mail was send."}', async () => {
      jest.spyOn(AuthPrismaMock.user, 'findUnique').mockResolvedValue(userMock);
      await expect(authService.forgetPassword(dto)).resolves.toEqual({
        message: 'A mail was send.',
      });
    });

    it('should return a Forbidden Exception, Your account is not activate', async () => {
      const user = { ...userMock };
      user.isActive = false;
      jest.spyOn(AuthPrismaMock.user, 'findUnique').mockResolvedValue(user);
      await expect(authService.forgetPassword(dto)).rejects.toEqual(
        new ForbiddenException('Your account is not activate'),
      );
    });
  });
  describe('resetPassword', () => {
    it('should return a { message: "Your password has been change"', async () => {
      jest.spyOn(argon, 'hash').mockResolvedValue('hashed new password');
      await expect(
        authService.resetPassword(userMock, { password: 'new password' }),
      ).resolves.toEqual({ message: 'Your password has been change' });
    });
  });
});
