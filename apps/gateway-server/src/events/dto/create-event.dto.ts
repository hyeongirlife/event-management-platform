import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum EventStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export class CreateEventDto {
  @ApiProperty({ description: '이벤트명', example: '2024 봄맞이 출석 이벤트' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: '이벤트 설명',
    example: '매일 출석 시 포인트 지급!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: '이벤트 시작일',
    example: '2024-03-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: '이벤트 종료일',
    example: '2024-03-31T23:59:59.000Z',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: '이벤트 상태',
    enum: EventStatus,
    default: EventStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus = EventStatus.SCHEDULED;

  @ApiPropertyOptional({
    description: '이벤트 조건(예: "USER_LEVEL_GTE_10")',
    example: 'USER_LEVEL_GTE_10',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  condition?: string;

  @ApiPropertyOptional({
    description: '이벤트 이미지 URL',
    example: 'https://cdn.example.com/event.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  imageUrl?: string;

  @ApiPropertyOptional({
    description: '이벤트 태그 목록',
    example: ['출석', '봄', '포인트'],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '최대 참여 인원', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxParticipants?: number;
}
