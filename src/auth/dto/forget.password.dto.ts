import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ForgetPasswordDTO {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @MaxLength(320)
  email: string;
}
