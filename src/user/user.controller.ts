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
import { User } from 'src/prisma/generated/client';
import { updateAccountDTO } from './dto';
import { UserService } from './user.service';
import { queryUserList } from 'src/utils/type';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('MyAsset')
  myAsset(@GetUser() user: User) {
    return this.userService.myAccount(user);
  }

  @Patch('MyAsset/update')
  updateAsset(@GetUser() user: User, @Body() dto: updateAccountDTO) {
    return this.userService.updateAccount(user, dto);
  }

  @Patch('account/desactivate')
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
