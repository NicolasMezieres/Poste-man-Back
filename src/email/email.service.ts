import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from 'src/prisma/generated';

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
    const url = `${process.env.FRONT_URL}?token=${token}`;
    const emailHTML = `<h1>${user.username} salut bg</h1>
    <p>Utilise ce lien pour valider ton compte <a href=${url}>Nique</a></p>`;
    await this.transporter.sendMail({
      from: this.config.get('SMTP_EMAIL'),
      to: user.email,
      subject: 'Validation account',
      html: emailHTML,
    });
  }

  async forgetPassword(user: User, token: string) {
    const url = `${process.env.FRONT_URL}forgetPassword/?=${token}`;
    const emailHTML = `<h1>${user.username}</h1>
    <p>Y faut croire que t'es Dory tiens clique ici : <a href=${url}>Nique</a></p>`;
    await this.transporter.sendMail({
      from: this.config.get('SMTP_EMAIL'),
      to: user.email,
      subject: 'Reset your password',
      html: emailHTML,
    });
  }
}
