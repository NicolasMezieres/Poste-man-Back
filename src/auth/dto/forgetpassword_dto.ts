import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class forgetPasswordDTO {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @MaxLength(320)
  email: string;
}
