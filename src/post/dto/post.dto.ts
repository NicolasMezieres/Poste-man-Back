import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
} from 'class-validator';

export class postDTO {
  @IsString()
  @IsNotEmpty()
  @Max(255)
  text: string;
  @IsOptional()
  @IsNumber()
  poseX: number;
  @IsOptional()
  @IsNumber()
  poseY: number;
}
