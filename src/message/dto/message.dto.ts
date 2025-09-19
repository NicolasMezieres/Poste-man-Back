import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class messageDTO {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  message: string;
}
