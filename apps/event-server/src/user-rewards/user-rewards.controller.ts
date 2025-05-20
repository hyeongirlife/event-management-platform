import {
  Controller,
  Post,
  Body,
  Req,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRewardsService } from './user-rewards.service';
import { ClaimRewardDto } from './dto/claim-reward.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { FindUserRewardsQueryDto } from './dto/find-user-rewards-query.dto';
import { FindAllUserRewardEntriesQueryDto } from './dto/find-all-user-reward-entries-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from 'src/common/enums/user-role.enum';

@ApiTags('사용자 보상')
@ApiBearerAuth('JWT-auth')
@Controller('user-rewards')
export class UserRewardsController {
  constructor(private readonly userRewardsService: UserRewardsService) {}

  @Get('admin')
  @Roles(UserRole.OPERATOR, UserRole.AUDITOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '(운영자용) 전체 사용자 보상 요청 내역 조회',
    description:
      '모든 사용자의 보상 요청 기록을 페이지네이션 및 필터링하여 조회합니다. OPERATOR, AUDITOR, ADMIN 역할 중 하나가 필요합니다.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden. Required role not met.' })
  @ApiResponse({
    status: 200,
    description: '전체 사용자 보상 내역 조회 성공',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserRewardEntryResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (토큰 누락 또는 유효하지 않음)',
  })
  async findAllUserEntries(
    @Query() queryDto: FindAllUserRewardEntriesQueryDto,
  ): Promise<any> {
    return this.userRewardsService.findAllUserRewardEntries(queryDto);
  }

  @Get('me')
  @ApiOperation({
    summary: '사용자 본인의 보상 요청 내역 조회',
    description:
      '로그인한 사용자의 모든 보상 요청 기록을 페이지네이션하여 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 보상 내역 조회 성공',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserRewardEntryResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async findMyRewards(
    @Req() req: any,
    @Query() queryDto: FindUserRewardsQueryDto,
  ): Promise<any> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('유저 ID가 존재하지 않습니다.');
    }

    return this.userRewardsService.findUserRewards(userId, queryDto);
  }

  @Post('claim')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '사용자 이벤트 보상 요청',
    description: '특정 이벤트에 대해 사용자가 보상을 요청합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '보상 요청 성공적으로 기록됨',
    type: '#/components/schemas/UserRewardEntryResponseDto',
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (예: eventId 누락)' })
  @ApiResponse({ status: 401, description: '인증 실패 req.user가 없음' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  @ApiResponse({
    status: 409,
    description:
      '이미 보상을 요청했거나, 이벤트가 활성 상태가 아니거나, 조건 미충족 등',
  })
  async claimReward(
    @Req() req: any,
    @Body() claimRewardDto: ClaimRewardDto,
  ): Promise<any> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('유저 ID가 존재하지 않습니다.');
    }

    return this.userRewardsService.claimReward(userId, claimRewardDto);
  }
}
