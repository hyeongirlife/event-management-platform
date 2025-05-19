import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { UserRewardEntryStatus } from '../schemas/user-reward-entry.schema';

export class FindAllUserRewardEntriesQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지 당 항목 수',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '정렬 기준 필드 (예: createdAt, userId, eventId, status)',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: '정렬 순서 (ASC 또는 DESC)',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: '필터링할 사용자 ID',
  })
  @IsOptional()
  @IsString() // 사용자 ID 형식이 문자열이라고 가정 (예: UUID 또는 외부 시스템 ID)
  userId?: string;

  @ApiPropertyOptional({
    description: '필터링할 이벤트 ID',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  eventId?: string;

  @ApiPropertyOptional({
    description: '필터링할 요청 처리 상태',
    enum: UserRewardEntryStatus,
  })
  @IsOptional()
  @IsEnum(UserRewardEntryStatus)
  status?: UserRewardEntryStatus;
}
