import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignUpDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(35)
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(35)
  lastName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(16)
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({ minLength: 16 })
  password: string;
}
