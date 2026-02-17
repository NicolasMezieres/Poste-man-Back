import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class SignInDTO {
  @ApiProperty({
    example: ['email: DaPendorero@gmail.com', 'username: DaPendoreropoi'],
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(320)
  identifier: string;

  @ApiProperty({ example: 'StronP@ssword123' })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({ minLength: 16 })
  password: string;
}
