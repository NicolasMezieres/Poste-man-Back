import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class updateAccountDTO {
  @ApiProperty({ example: 'Pedro' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(35)
  firstName: string;
  @ApiProperty({ example: 'Pedro' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(35)
  lastName: string;
  @ApiProperty({ example: 'Pedro' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(16)
  username: string;

  @ApiProperty({ example: 'Pedro@gmail.com' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(320)
  email: string;
}
