import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsMongoId,
  IsOptional,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { RewardType } from '../schemas/reward.schema';

export class CreateRewardDto {
  @ApiProperty({ description: '보상 이름', example: '1억 메소 지급' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: '보상 유형',
    enum: RewardType,
    example: RewardType.POINT,
  })
  @IsEnum(RewardType)
  @IsNotEmpty()
  type: RewardType;

  @ApiProperty({
    description: '보상 수량 (예: 포인트, 아이템 개수)',
    example: 1000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    description: '보상 상세 설명',
    example: '특별 이벤트 기념 골드',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: '아이템 코드 (유형이 ITEM일 경우 필수)',
    example: 'ITEM_GOLD_P_1000',
  })
  @ValidateIf((o) => o.type === RewardType.ITEM)
  @IsNotEmpty({ message: '아이템 유형의 보상에는 itemCode가 필요합니다.' })
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional({
    description: '쿠폰 코드 (유형이 COUPON일 경우 필수)',
    example: 'WELCOME_COUPON_2024',
  })
  @ValidateIf((o) => o.type === RewardType.COUPON)
  @IsNotEmpty({ message: '쿠폰 유형의 보상에는 couponCode가 필요합니다.' })
  @IsString()
  couponCode?: string;

  @ApiProperty({
    description: '연결된 이벤트의 ID',
    example: '60f7e1b9c9d3f0001f7b8e1a',
  })
  @IsMongoId({ message: '유효한 이벤트 ID 형식이 아닙니다.' })
  @IsNotEmpty()
  eventId: string;

  // createdBy는 서비스 레벨에서 주입
}
