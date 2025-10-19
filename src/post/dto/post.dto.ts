import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class postDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  text: string;
  @IsOptional()
  @IsNumber()
  poseX?: number;
  @IsOptional()
  @IsNumber()
  poseY?: number;
}
