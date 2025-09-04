import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
export class projectDTO {
  @IsNotEmpty()
  @MaxLength(16)
  @MinLength(1)
  @IsString()
  name: string;
}
