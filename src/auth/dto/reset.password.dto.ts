import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class ResetPasswordDTO {
  @ApiProperty()
  @IsStrongPassword({ minLength: 16 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  password: string;
}
