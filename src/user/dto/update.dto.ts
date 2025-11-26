import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class updateAccountDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(35)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(35)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(16)
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(320)
  email: string;
}
