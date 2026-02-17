import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ForgetPasswordDTO {
  @ApiProperty({ example: 'DaPendorero@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @MaxLength(320)
  email: string;
}
