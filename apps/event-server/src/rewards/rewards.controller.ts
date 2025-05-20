import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { FindAllRewardsQueryDto } from './dto/find-all-rewards-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RolesGuard } from 'src/common/guards';

@ApiTags('보상')
@ApiBearerAuth('JWT-auth')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '새 보상 생성 (운영자/관리자)',
    description: '특정 이벤트에 연결되는 새로운 보상을 시스템에 등록합니다.',
  })
  @ApiResponse({ status: 201, description: '보상 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 파라미터' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '연결하려는 이벤트를 찾을 수 없음' })
  create(@Body() createRewardDto: CreateRewardDto, @Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('사용자 ID가 필요합니다.');
    }
    return this.rewardsService.create(createRewardDto, userId);
  }

  @Get()
  @Roles(UserRole.AUDITOR, UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '모든 보상 조회 (페이지네이션, 필터링, 정렬 지원)',
    description:
      '시스템에 등록된 모든 보상을 페이지네이션, 필터링(eventId, type), 정렬 옵션과 함께 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '보상 목록 조회 성공 (페이지네이션 정보 포함)',
  })
  findAll(@Query() query: FindAllRewardsQueryDto) {
    return this.rewardsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.AUDITOR, UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '특정 보상 상세 조회',
    description: 'ID를 사용하여 특정 보상의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '보상 ID (MongoDB ObjectId)',
    type: String,
  })
  @ApiResponse({ status: 200, description: '보상 상세 정보 조회 성공' })
  @ApiResponse({ status: 404, description: '보상을 찾을 수 없음' })
  findOne(@Param('id', new ParseObjectIdPipe()) id: string) {
    return this.rewardsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '특정 보상 수정 (운영자/관리자)',
    description: 'ID를 사용하여 특정 보상을 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '보상 ID', type: String })
  @ApiResponse({ status: 200, description: '보상 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 파라미터' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({
    status: 404,
    description: '보상 또는 관련 이벤트를 찾을 수 없음',
  })
  update(
    @Param('id', new ParseObjectIdPipe()) id: string,
    @Body() updateRewardDto: UpdateRewardDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('사용자 ID가 필요합니다.');
    }
    return this.rewardsService.update(id, updateRewardDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '특정 보상 삭제 (운영자/관리자)',
    description: 'ID를 사용하여 특정 보상을 논리적으로 삭제합니다.',
  })
  @ApiParam({ name: 'id', description: '보상 ID', type: String })
  @ApiResponse({ status: 200, description: '보상 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '보상을 찾을 수 없음' })
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('사용자 ID가 필요합니다.');
    }
    return this.rewardsService.remove(id, userId);
  }

  @Get('by-event/:eventId')
  @ApiOperation({
    summary: '이벤트별 보상 목록 조회',
    description: '특정 이벤트에 연결된 모든 보상 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'eventId',
    description: '이벤트 ID (MongoDB ObjectId)',
    type: String,
  })
  @ApiResponse({ status: 200, description: '이벤트별 보상 목록 조회 성공' })
  findByEventId(@Param('eventId', new ParseObjectIdPipe()) eventId: string) {
    return this.rewardsService.findByEventId(eventId);
  }
}
