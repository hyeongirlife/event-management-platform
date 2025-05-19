import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiForbiddenResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

export enum RewardType {
  POINT = 'POINT',
  ITEM = 'ITEM',
  COUPON = 'COUPON',
}

@ApiTags('보상')
@ApiBearerAuth('JWT-auth')
@Controller('')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '보상 등록',
    description: '운영자/관리자만 새로운 보상을 등록할 수 있습니다.',
  })
  @ApiBody({
    description: '보상 등록 요청 DTO',
    required: true,
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: '1억 메소 지급',
          description: '보상 이름',
          maxLength: 100,
        },
        type: {
          type: 'string',
          enum: Object.values(RewardType),
          example: RewardType.POINT,
          description: '보상 유형',
        },
        quantity: {
          type: 'number',
          example: 1000,
          minimum: 0,
          description: '보상 수량 (예: 포인트, 아이템 개수)',
        },
        description: {
          type: 'string',
          example: '특별 이벤트 기념 골드',
          description: '보상 상세 설명',
          maxLength: 500,
        },
        itemCode: {
          type: 'string',
          example: 'ITEM_GOLD_P_1000',
          description: '아이템 코드 (유형이 ITEM일 경우 필수)',
        },
        couponCode: {
          type: 'string',
          example: 'WELCOME_COUPON_2024',
          description: '쿠폰 코드 (유형이 COUPON일 경우 필수)',
        },
        eventId: {
          type: 'string',
          example: '60f7e1b9c9d3f0001f7b8e1a',
          description: '연결된 이벤트의 ID',
          pattern: '^[a-fA-F0-9]{24}$',
        },
      },
      required: ['name', 'type', 'quantity', 'eventId'],
    },
  })
  @ApiResponse({ status: 201, description: '보상 등록 성공' })
  @ApiForbiddenResponse({ description: '권한 없음 (운영자/관리자만 가능)' })
  async createReward(@Body() createRewardDto: any, @Req() req: any) {
    return this.rewardsService.createReward(createRewardDto, req);
  }

  @Get()
  @Roles(UserRole.AUDITOR, UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '보상 전체 목록 조회',
    description: '모든 보상 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '보상 목록 조회 성공' })
  async findAllRewards(@Query() query: any, @Req() req: any) {
    return this.rewardsService.findAllRewards(query, req);
  }

  @Get(':id')
  @Roles(UserRole.AUDITOR, UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '보상 상세 조회',
    description: '특정 보상 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '보상 ID' })
  @ApiResponse({ status: 200, description: '보상 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '보상을 찾을 수 없음' })
  async findRewardById(@Param('id') id: string, @Req() req: any) {
    return this.rewardsService.findRewardById(id, req);
  }

  @Patch(':id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '보상 수정',
    description: '운영자/관리자만 보상 정보를 수정할 수 있습니다.',
  })
  @ApiParam({ name: 'id', description: '보상 ID' })
  @ApiResponse({ status: 200, description: '보상 수정 성공' })
  @ApiForbiddenResponse({ description: '권한 없음 (운영자/관리자만 가능)' })
  async updateReward(
    @Param('id') id: string,
    @Body() updateRewardDto: any,
    @Req() req: any,
  ) {
    return this.rewardsService.updateReward(id, updateRewardDto, req);
  }

  @Delete(':id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '보상 삭제',
    description: '운영자/관리자만 보상을 삭제할 수 있습니다.',
  })
  @ApiParam({ name: 'id', description: '보상 ID' })
  @ApiResponse({ status: 200, description: '보상 삭제 성공' })
  @ApiForbiddenResponse({ description: '권한 없음 (운영자/관리자만 가능)' })
  async deleteReward(@Param('id') id: string, @Req() req: any) {
    return this.rewardsService.deleteReward(id, req);
  }

  // 이벤트별 보상 목록 조회
  @Get('/by-event/:eventId')
  @Roles(UserRole.OPERATOR, UserRole.AUDITOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '이벤트별 보상 목록 조회',
    description: '특정 이벤트에 연결된 보상 목록을 조회합니다.',
  })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiResponse({ status: 200, description: '이벤트별 보상 목록 조회 성공' })
  async findRewardsByEvent(@Param('eventId') eventId: string, @Req() req: any) {
    return this.rewardsService.findRewardsByEvent(eventId, req);
  }
}
