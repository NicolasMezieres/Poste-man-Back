import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class changeAvatarDTO {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  icon: string;
}
