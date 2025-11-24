import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { User } from 'src/prisma/generated/client';
import {
  inscriptionEmailTemplate,
  sendPasswordResetTemplate,
} from 'src/utils/templateemail';
import { EmailService } from './email.service';

jest.mock('nodemailer');
jest.mock('src/utils/templateemail', () => ({
  inscriptionEmailTemplate: jest.fn(),
  sendPasswordResetTemplate: jest.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue(true);

    const createTransportMock = {
      sendMail: sendMailMock,
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(
      createTransportMock,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                SMTP_HOST: 'smtp.example.com',
                SMTP_PORT: '587',
                SMTP_EMAIL: 'test@example.com',
                SMTP_PASSWORD: 'password',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);

    process.env.FRONT_URL = 'http://localhost:3000/';
    process.env.MAILER_SECURE = 'false';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('accountConfirmation', () => {
    it('should send account confirmation email', async () => {
      const user: User = {
        email: 'user@example.com',
        username: 'john',
      } as User;
      const token = 'abc123';
      const expectedUrl = `${process.env.FRONT_URL}validAccount?token=${token}`;

      (inscriptionEmailTemplate as jest.Mock).mockReturnValue('<p>Welcome</p>');

      await service.accountConfirmation(user, token);

      expect(inscriptionEmailTemplate).toHaveBeenCalledWith(
        expectedUrl,
        'john',
      );
      expect(sendMailMock).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Validation account',
        html: '<p>Welcome</p>',
      });
    });
  });

  describe('forgetPassword', () => {
    it('should send password reset email', async () => {
      const user: User = {
        email: 'user@example.com',
        username: 'john',
      } as User;
      const token = 'reset123';
      const expectedUrl = `${process.env.FRONT_URL}resetPassword/${token}`;

      (sendPasswordResetTemplate as jest.Mock).mockReturnValue(
        '<p>Reset Password</p>',
      );

      await service.forgetPassword(user, token);

      expect(sendPasswordResetTemplate).toHaveBeenCalledWith(
        'john',
        expectedUrl,
      );
      expect(sendMailMock).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Reset your password',
        html: '<p>Reset Password</p>',
      });
    });
  });
});
