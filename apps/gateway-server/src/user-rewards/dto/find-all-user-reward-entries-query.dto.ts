import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsMongoId,
  IsEnum,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRewardEntryStatus } from './find-user-rewards-query.dto';

export class FindAllUserRewardEntriesQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지 당 항목 수', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '정렬 기준 필드', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: '정렬 순서',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: '유저 ID', example: 'user123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: '이벤트 ID',
    example: '60f7e1b9c9d3f0001f7b8e1a',
  })
  @IsOptional()
  @IsMongoId()
  eventId?: string;

  @ApiPropertyOptional({
    description: '보상 상태',
    enum: UserRewardEntryStatus,
  })
  @IsOptional()
  @IsEnum(UserRewardEntryStatus)
  status?: UserRewardEntryStatus;
}
