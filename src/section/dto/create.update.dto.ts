import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class createDTO {
  @ApiProperty({ example: 'Viande' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(16)
  name: string;
}

export class updateDTO {
  @ApiProperty({ example: 'Viandes' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(16)
  name: string;
}
