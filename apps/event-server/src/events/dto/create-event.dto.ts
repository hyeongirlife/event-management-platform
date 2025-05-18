import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { EventStatus } from '../schemas/event.schema';

export class CreateEventDto {
  @ApiProperty({
    description: '이벤트 이름 (3자 이상 100자 이하)',
    example: '신규 유저 환영 이벤트!',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: '이벤트 상세 설명 (500자 이하)',
    example: '가입 후 7일 이내 달성 가능한 특별 미션입니다.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: '이벤트 참여/보상 조건',
    example: '이벤트 기간 내 튜토리얼 완료 시',
  })
  @IsString()
  @IsNotEmpty()
  condition: string;

  @ApiProperty({
    description: '이벤트 시작 일시 (ISO 8601 형식)',
    example: '2024-08-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string; // Date 타입으로 받아도 되지만, class-validator의 IsDateString이 ISO 문자열 검증에 용이

  @ApiProperty({
    description: '이벤트 종료 일시 (ISO 8601 형식)',
    example: '2024-08-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({
    description: '이벤트 초기 상태 (기본값: SCHEDULED)',
    enum: EventStatus,
    example: EventStatus.SCHEDULED,
    default: EventStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  // TODO: createdBy는 요청 본문이 아니라, 인증된 사용자 정보에서 가져와 서비스 로직에서 설정
  // @ApiPropertyOptional({ description: '이벤트 생성자 ID (운영자/관리자)' })
  // @IsOptional()
  // @IsMongoId() // 또는 IsString() - 사용자 ID 형식에 따라
  // createdBy?: string;
}
