import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRewardEntryStatus } from '../schemas/user-reward-entry.schema';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Types } from 'mongoose'; // For ObjectId type check

@Exclude()
export class UserRewardEntryResponseDto {
  @ApiProperty({ type: String, description: 'UserRewardEntry ID' })
  @Expose()
  @Transform(
    ({ value }) => {
      if (value instanceof Types.ObjectId) {
        return value.toHexString();
      }
      return value;
    },
    { toPlainOnly: true },
  )
  _id: string;

  @ApiProperty({ description: '사용자 ID' })
  @Expose()
  userId: string;

  @ApiProperty({ type: String, description: '이벤트 ID' })
  @Expose()
  @Transform(
    ({ value }) => {
      if (value instanceof Types.ObjectId) {
        return value.toHexString();
      }
      if (
        value &&
        typeof value === 'object' &&
        value._id instanceof Types.ObjectId
      ) {
        return value._id.toHexString();
      }
      return value;
    },
    { toPlainOnly: true },
  )
  eventId: string;

  @ApiProperty({ enum: UserRewardEntryStatus, description: '요청 처리 상태' })
  @Expose()
  status: UserRewardEntryStatus;

  @ApiPropertyOptional({ description: '조건 검증 완료 일시' })
  @Expose()
  @Type(() => Date)
  validatedAt?: Date;

  @ApiPropertyOptional({ description: '보상 지급 완료 일시' })
  @Expose()
  @Type(() => Date)
  rewardedAt?: Date;

  @ApiPropertyOptional({ description: '실패 사유' })
  @Expose()
  failureReason?: string;

  @ApiPropertyOptional({
    type: [String],
    description: '지급된 Reward ID 목록',
  })
  @Expose()
  @Transform(
    ({ value }) => {
      if (Array.isArray(value)) {
        return value.map((item) => {
          if (item instanceof Types.ObjectId) {
            return item.toHexString();
          }
          if (
            item &&
            typeof item === 'object' &&
            item._id instanceof Types.ObjectId
          ) {
            return item._id.toHexString();
          }
          return item;
        });
      }
      return value;
    },
    { toPlainOnly: true },
  )
  grantedRewards?: string[];

  @ApiPropertyOptional({
    type: [Object],
    description: '지급된 보상 상세 내용 스냅샷',
  })
  @Expose()
  grantedRewardDetails?: Record<string, any>[];

  @ApiProperty({ description: '문서 생성 일시' })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: '문서 마지막 업데이트 일시' })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  // 필요에 따라 validationDetails, createdBy, updatedBy 등 추가 가능
}
