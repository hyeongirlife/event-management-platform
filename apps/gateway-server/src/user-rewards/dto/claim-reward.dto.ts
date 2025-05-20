import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ClaimRewardDto {
  @ApiProperty({
    description: '이벤트 ID',
    example: '60f7e1b9c9d3f0001f7b8e1a',
  })
  @IsMongoId({ message: '유효한 이벤트 ID 형식이 아닙니다.' })
  @IsNotEmpty()
  eventId: string;
}
