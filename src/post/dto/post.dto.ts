import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
export class postDTO {
  @ApiProperty({
    example: 'hi everybody !',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  text: string;
}
