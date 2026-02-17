import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class movePostDTO {
  @ApiProperty({ example: -156, type: Number })
  @IsNumber()
  poseX: number;
  @ApiProperty({ example: 385, type: Number })
  @IsNumber()
  poseY: number;
}
