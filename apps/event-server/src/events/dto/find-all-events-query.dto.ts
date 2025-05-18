import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsDate,
} from 'class-validator';
import { EventStatus } from '../schemas/event.schema';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FindAllEventsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
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
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Filter by event name (partial match, case-insensitive)',
    example: 'Summer',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by event status',
    enum: EventStatus,
    example: EventStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Filter for events starting after this date (ISO 8601 string)',
    example: '2024-07-01T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date) // Transform string to Date
  @IsDate()
  startDateAfter?: Date;

  @ApiPropertyOptional({
    description:
      'Filter for events starting before this date (ISO 8601 string)',
    example: '2024-09-01T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDateBefore?: Date;

  @ApiPropertyOptional({
    description: 'Filter for events ending after this date (ISO 8601 string)',
    example: '2024-08-01T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDateAfter?: Date;

  @ApiPropertyOptional({
    description: 'Filter for events ending before this date (ISO 8601 string)',
    example: '2024-10-01T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDateBefore?: Date;
}
