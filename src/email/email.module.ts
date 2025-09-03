import { Module } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService, AuthService],
})
export class EmailModule {}
