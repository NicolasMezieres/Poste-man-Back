import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class changePasswordDTO {
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({ minLength: 16 })
  @MaxLength(255)
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({ minLength: 16 })
  @MaxLength(255)
  oldPassword: string;
}
