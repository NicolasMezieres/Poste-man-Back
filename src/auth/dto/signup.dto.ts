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
  @ApiProperty({ example: 'Lasnico' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(35)
  firstName: string;

  @ApiProperty({ example: 'DaPendorero' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(35)
  lastName: string;

  @ApiProperty({ example: 'DaPendorero@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  email: string;

  @ApiProperty({ example: 'DaPendoreropoi' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(16)
  username: string;

  @ApiProperty({ example: 'StrongP@ssword123' })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({ minLength: 16 })
  password: string;
}
