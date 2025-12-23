import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
export class postDTO {
  @ApiProperty({
    example: 'hi everybody !',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  text: string;
  @ApiProperty({ example: -156, type: Number })
  @IsNumber()
  poseX: number;
  @ApiProperty({ example: 385, type: Number })
  @IsNumber()
  poseY: number;
}
