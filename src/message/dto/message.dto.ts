import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class messageDTO {
  @ApiProperty({ example: 'hi everybody !', type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  message: string;
}
