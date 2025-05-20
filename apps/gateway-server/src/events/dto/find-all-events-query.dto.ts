import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from './create-event.dto';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FindAllEventsQueryDto {
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
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ description: '이벤트명(부분 일치)', example: '출석' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '이벤트 상태', enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    description: '시작일 이후',
    example: '2024-03-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDateAfter?: string;

  @ApiPropertyOptional({
    description: '시작일 이전',
    example: '2024-03-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDateBefore?: string;

  @ApiPropertyOptional({
    description: '종료일 이후',
    example: '2024-03-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDateAfter?: string;

  @ApiPropertyOptional({
    description: '종료일 이전',
    example: '2024-03-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDateBefore?: string;
}
