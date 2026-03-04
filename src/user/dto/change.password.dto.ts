import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class changePasswordDTO {
  //todo api
  @ApiProperty({ example: 'NewStrongP@ssword73' })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({ minLength: 16 })
  @MaxLength(255)
  password: string;

  @ApiProperty({ example: 'OldStrongP@ssword73' })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({ minLength: 16 })
  @MaxLength(255)
  oldPassword: string;
}
