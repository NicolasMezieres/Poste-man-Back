import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class voteDTO {
  @ApiProperty({ examples: [true, false], type: Boolean })
  @IsBoolean()
  @IsNotEmpty()
  isUp: boolean;
}
