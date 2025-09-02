import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class SignInDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(320)
  identifier: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({ minLength: 16 })
  password: string;
}
