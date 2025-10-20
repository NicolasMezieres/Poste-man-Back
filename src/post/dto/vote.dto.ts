import { IsBoolean, IsNotEmpty } from 'class-validator';

export class voteDTO {
  @IsBoolean()
  @IsNotEmpty()
  isUp: boolean;
}
