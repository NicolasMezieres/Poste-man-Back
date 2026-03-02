import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class changeAvatarDTO {
  @ApiProperty({ example: 'cat' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  icon: string;
}
