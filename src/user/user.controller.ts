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
import { ApiResponse } from '@nestjs/swagger';
import { changePasswordDTO } from './dto/change.password.dto';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: 200,
    description: 'Get your information of your account !',
  })
  @Get('myAccount')
  myAccount(@GetUser() user: User) {
    return this.userService.myAccount(user);
  }

  @ApiResponse({ status: 201, description: 'You account has been updated !' })
  @ApiResponse({ status: 403, description: 'Email or Username already used !' })
  @Patch('myAccount')
  updateAccount(@GetUser() user: User, @Body() dto: updateAccountDTO) {
    return this.userService.updateAccount(user, dto);
  }

  @Patch('changePassword')
  changePassword(@GetUser() user: User, @Body() dto: changePasswordDTO) {
    return this.userService.changePassword(user, dto);
  }

  @Delete('account/desactivate')
  deleteAccount(@GetUser() user: User) {
    return this.userService.deleteAccount(user);
  }

  @UseGuards(AdminGuard)
  @Get('userList')
  searchUser(@Query() query: queryUserList) {
    return this.userService.listUser(query);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/ban')
  banUser(@GetUser() user: User, @Param('id') id: string) {
    return this.userService.banUser(user, id);
  }

  @UseGuards(AdminGuard)
  @Delete(':id/delete')
  deleteUser(@GetUser() user: User, @Param('id') id: string) {
    return this.userService.deleteUser(user, id);
  }
}
