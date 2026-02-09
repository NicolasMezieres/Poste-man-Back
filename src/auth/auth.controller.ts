import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiResponse,
} from '@nestjs/swagger';
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
import { UserWithRole } from 'src/utils/type';
import { role } from 'src/utils/enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ status: 201, description: 'Your account as been create !' })
  @ApiResponse({ status: 401, description: 'Username or Email already taken' })
  @ApiInternalServerErrorResponse()
  @Post('signup')
  signup(@Body() dto: SignUpDTO) {
    return this.authService.signup(dto);
  }

  @ApiResponse({ status: 201, description: 'Your account is active !' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Patch('activationAccount/:token')
  activationAccount(@Param('token') token: string) {
    return this.authService.activationAccount(token);
  }

  @ApiResponse({ status: 201, description: 'Connexion succesfully' })
  @ApiResponse({
    status: 401,
    description: 'Invalid credential or Account not active !',
  })
  @Post('signin')
  signin(@Body() dto: SignInDTO, @Res({ passthrough: true }) res: Response) {
    return this.authService.signin(dto, res);
  }

  @ApiResponse({ status: 201, description: 'A mail was send.' })
  @ApiResponse({ status: 403, description: 'Account not active' })
  @Post('forgetPassword')
  forgetPassword(@Body() dto: ForgetPasswordDTO) {
    return this.authService.forgetPassword(dto);
  }

  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Your password has been change' })
  @ApiResponse({ status: 401, description: 'UnAuthorized' })
  @UseGuards(JwtGuard)
  @Patch('resetPassword')
  resetPassword(@GetUser() user: User, @Body() dto: ResetPasswordDTO) {
    return this.authService.resetPassword(user, dto);
  }

  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Your password has been change' })
  @ApiResponse({ status: 401, description: 'UnAuthorized' })
  @UseGuards(ResetPasswordGuard)
  @Patch('resetPasswordWithToken')
  resetPasswordWithToken(@GetUser() user: User, @Body() dto: ResetPasswordDTO) {
    return this.authService.resetPassword(user, dto);
  }

  @ApiResponse({ status: 201, description: 'Deconnection Success' })
  @Delete('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return { message: 'Deconnection Success' };
  }
  @UseGuards(JwtGuard)
  @Get('log')
  log(@GetUser() user: UserWithRole) {
    return { message: 'connecté', isAdmin: user.role.name === role.ADMIN };
  }
}
