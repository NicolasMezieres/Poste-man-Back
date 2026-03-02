import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorator';
import { AdminGuard, JwtGuard } from 'src/auth/Guards';
import { User } from 'src/prisma/generated';
import { updateAccountDTO } from './dto';
import { UserService } from './user.service';
import { queryUserList } from 'src/utils/type';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { changePasswordDTO } from './dto/change.password.dto';
import { changeAvatarDTO } from './dto/change.avatar.dto';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOkResponse({
    description: 'Information de votre compte !',
  })
  @Get('myAccount')
  myAccount(@GetUser() user: User) {
    return this.userService.myAccount(user);
  }

  @ApiResponse({ status: 200, description: 'Compte modifié !' })
  @ApiResponse({
    status: 403,
    description: 'Email ou Pseudonyme déjà utilisé !',
  })
  @Patch('myAccount')
  updateAccount(@GetUser() user: User, @Body() dto: updateAccountDTO) {
    return this.userService.updateAccount(user, dto);
  }

  @ApiOkResponse({ description: 'Mot de passe mis à jour' })
  @ApiForbiddenResponse({ description: 'Mot de passe incorrecte' })
  @Patch('changePassword')
  changePassword(@GetUser() user: User, @Body() dto: changePasswordDTO) {
    return this.userService.changePassword(user, dto);
  }

  @ApiOkResponse({ description: 'Avatar modifié' })
  @Patch('changeAvatar')
  changeAvatar(@Body() dto: changeAvatarDTO, @GetUser() user: User) {
    return this.userService.changeAvatar(user, dto);
  }

  @ApiOkResponse({ description: 'Compte supprimé !' })
  @Delete('account/desactivate')
  deleteAccount(@GetUser() user: User) {
    return this.userService.deleteAccount(user);
  }

  @ApiOkResponse({ description: "Liste d'utilisateur" })
  @UseGuards(AdminGuard)
  @Get('userList')
  searchUser(@Query() query: queryUserList) {
    return this.userService.listUser(query);
  }

  @ApiOkResponse({ description: "Information de l'utilisitateur" })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  @UseGuards(AdminGuard)
  @Get('/:userId/detail')
  detailUser(@Param('userId') userId: string) {
    return this.userService.detailUser(userId);
  }

  @ApiOkResponse({ description: "Status de l'utilisateur modifié" })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable !' })
  @UseGuards(AdminGuard)
  @Patch(':id/ban')
  banUser(@GetUser() user: User, @Param('id') id: string) {
    return this.userService.banUser(user, id);
  }

  @ApiOkResponse({ description: 'Utilisateur supprimé !' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable !' })
  @UseGuards(AdminGuard)
  @Delete(':id/delete')
  deleteUser(@GetUser() user: User, @Param('id') id: string) {
    return this.userService.deleteUser(user, id);
  }
}
