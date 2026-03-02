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

  @ApiResponse({ status: 201, description: 'Votre compte à été créer !' })
  @ApiResponse({ status: 401, description: 'Pseudo ou Email déjà utilisé' })
  @ApiInternalServerErrorResponse()
  @Post('signup')
  signup(@Body() dto: SignUpDTO) {
    return this.authService.signup(dto);
  }

  @ApiResponse({ status: 201, description: 'Votre compte a été activé !' })
  @ApiResponse({ status: 404, description: 'Compte introuvable' })
  @Patch('activationAccount/:token')
  activationAccount(@Param('token') token: string) {
    return this.authService.activationAccount(token);
  }

  @ApiResponse({ status: 201, description: 'Connexion réussi' })
  @ApiResponse({
    status: 401,
    description: 'Compte inactif ou Identifiant ou mot de passe incorrecte',
  })
  @Post('signin')
  signin(@Body() dto: SignInDTO, @Res({ passthrough: true }) res: Response) {
    return this.authService.signin(dto, res);
  }

  @ApiResponse({ status: 201, description: 'Un email a été envoyé' })
  @ApiResponse({ status: 403, description: "Votre compte n'est pas activé" })
  @Post('forgetPassword')
  forgetPassword(@Body() dto: ForgetPasswordDTO) {
    return this.authService.forgetPassword(dto);
  }

  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Votre mot de passe a été modifié' })
  @UseGuards(JwtGuard)
  @Patch('resetPassword')
  resetPassword(@GetUser() user: User, @Body() dto: ResetPasswordDTO) {
    return this.authService.resetPassword(user, dto);
  }

  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Votre mot de passe a été modifié' })
  @UseGuards(ResetPasswordGuard)
  @Patch('resetPasswordWithToken')
  resetPasswordWithToken(@GetUser() user: User, @Body() dto: ResetPasswordDTO) {
    return this.authService.resetPassword(user, dto);
  }

  @ApiResponse({ status: 201, description: 'Deconnection réussi' })
  @Delete('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    return { message: 'Deconnection réussi' };
  }
  @ApiResponse({ status: 200, description: 'Utilisateur connecté' })
  @UseGuards(JwtGuard)
  @Get('log')
  log(@GetUser() user: UserWithRole) {
    return { message: 'connecté', isAdmin: user.role.name === role.ADMIN };
  }
}
