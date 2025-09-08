import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import type { User } from 'src/prisma/generated';
import { AuthService } from './auth.service';
import { GetUser } from './decorator';
import {
  ForgetPasswordDTO,
  ResetPasswordDTO,
  SignInDTO,
  SignUpDTO,
} from './dto';
import { JwtGuard, ResetPasswordGuard } from './Guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ status: 201, description: 'Your account as been create !' })
  @Post('signup')
  signup(@Body() dto: SignUpDTO) {
    return this.authService.signup(dto);
  }

  @ApiResponse({ status: 201, description: 'Your account is active !' })
  @Patch('activationAccount/:token')
  activationAccount(@Param('token') token: string) {
    return this.authService.activationAccount(token);
  }

  @ApiResponse({ status: 201, description: 'Connexion succesfully' })
  @Post('signin')
  signin(@Body() dto: SignInDTO, @Res({ passthrough: true }) res: Response) {
    return this.authService.signin(dto, res);
  }

  @ApiResponse({ status: 201, description: 'A mail was send.' })
  @Post('forgetpassword')
  forgetPassword(@Body() dto: ForgetPasswordDTO) {
    return this.authService.forgetPassword(dto);
  }

  @ApiCookieAuth()
  @ApiResponse({ status: 201, description: 'Your password has been change' })
  @ApiResponse({ status: 401, description: 'UnAuthorized' })
  @UseGuards(ResetPasswordGuard)
  @Post('resetPassword')
  resetPassword(@GetUser() user: User, @Body() dto: ResetPasswordDTO) {
    return this.authService.resetPassword(user, dto);
  }

  @ApiResponse({ status: 201, description: 'Deconnection Success' })
  @UseGuards(JwtGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return { message: 'Deconnection Success' };
  }
}
