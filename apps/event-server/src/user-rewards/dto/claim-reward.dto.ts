import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';
// import { Schema as MongooseSchema } from 'mongoose'; // ObjectId 타입을 직접 사용하지 않으므로 주석 처리 또는 삭제

export class ClaimRewardDto {
  @ApiProperty({
    description: '보상을 요청할 이벤트의 ID',
    example: '60f7ea8e9b6e4b3e8c7f8b1a',
    type: String,
  })
  @IsNotEmpty()
  @IsMongoId() // 입력값이 MongoDB ObjectId 형식인지 검증
  eventId: string; // 타입을 string으로 변경
}
