import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from 'src/prisma/generated';
import {
  inscriptionEmailTemplate,
  sendPasswordResetTemplate,
} from 'src/utils/templateemail';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT')),
      secure: process.env.MAILER_SECURE === 'false',
      auth: {
        user: this.config.get('SMTP_EMAIL'),
        pass: this.config.get('SMTP_PASSWORD'),
      },
    });
  }

  async accountConfirmation(user: User, token: string) {
    const url = `${process.env.FRONT_URL}/validAccount?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.get('SMTP_EMAIL'),
      to: user.email,
      subject: 'Validation de compte',
      html: inscriptionEmailTemplate(url, user.username),
    });
  }

  async forgetPassword(user: User, token: string) {
    const url = `${process.env.FRONT_URL}/resetPassword/${token}`;
    await this.transporter.sendMail({
      from: this.config.get('SMTP_EMAIL'),
      to: user.email,
      subject: 'Réinitialisation de vôtre mot de passe',
      html: sendPasswordResetTemplate(user.username, url),
    });
  }
}
