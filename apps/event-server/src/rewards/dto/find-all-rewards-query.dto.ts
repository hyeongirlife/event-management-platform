import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { RewardType } from '../schemas/reward.schema';

// SortOrder는 Event 모듈의 것을 재사용하거나 여기에 다시 정의할 수 있습니다.
// 여기서는 Event 모듈의 SortOrder를 직접 참조하지 않고, 필요하다면 공통 DTO로 분리할 수 있습니다.
export enum RewardSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FindAllRewardsQueryDto {
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
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '정렬 기준 필드',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: '정렬 순서',
    enum: RewardSortOrder,
    default: RewardSortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(RewardSortOrder)
  sortOrder?: RewardSortOrder = RewardSortOrder.DESC;

  @ApiPropertyOptional({
    description: '필터링할 이벤트 ID',
    example: '60f7e1b9c9d3f0001f7b8e1a',
  })
  @IsOptional()
  @IsMongoId()
  eventId?: string;

  @ApiPropertyOptional({
    description: '필터링할 보상 유형',
    enum: RewardType,
    example: RewardType.POINT,
  })
  @IsOptional()
  @IsEnum(RewardType)
  type?: RewardType;
}
