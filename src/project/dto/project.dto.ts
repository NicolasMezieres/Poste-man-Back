import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
export class projectDTO {
  @ApiProperty({ example: 'Barbecue party', minLength: 1, maxLength: 16 })
  @IsNotEmpty()
  @MaxLength(16)
  @MinLength(1)
  @IsString()
  name: string;
}
