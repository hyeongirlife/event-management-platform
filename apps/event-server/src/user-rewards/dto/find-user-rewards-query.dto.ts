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

export class FindUserRewardsQueryDto {
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
  @Max(100) // 페이지 당 최대 100개로 제한
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '정렬 기준 필드 (예: createdAt, status, updatedAt)',
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
