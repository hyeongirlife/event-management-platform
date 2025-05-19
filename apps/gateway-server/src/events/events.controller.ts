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
import { EventsService } from './events.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateEventDto, EventStatus } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FindAllEventsQueryDto } from './dto/find-all-events-query.dto';

@ApiTags('이벤트')
@ApiBearerAuth('JWT-auth')
@Controller('')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '새 이벤트 생성 (운영자/관리자)',
    description: '새로운 이벤트를 시스템에 등록합니다.',
  })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: 201, description: '이벤트 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 파라미터' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    return this.eventsService.create(createEventDto, req);
  }

  @Get()
  @Roles(UserRole.AUDITOR, UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '모든 이벤트 조회 (페이지네이션, 필터링, 정렬 지원)',
    description:
      '시스템에 등록된 모든 이벤트를 페이지네이션, 필터링, 정렬 옵션과 함께 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '이벤트 목록 조회 성공 (페이지네이션 정보 포함)',
  })
  async findAll(@Query() query: FindAllEventsQueryDto, @Req() req: any) {
    return this.eventsService.findAll(query, req);
  }

  @Get(':id')
  @Roles(UserRole.AUDITOR, UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '특정 이벤트 상세 조회',
    description: 'ID를 사용하여 특정 이벤트의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiResponse({ status: 200, description: '이벤트 상세 정보 조회 성공' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.eventsService.findOne(id, req);
  }

  @Patch(':id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '특정 이벤트 수정 (운영자/관리자)',
    description: 'ID를 사용하여 특정 이벤트를 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: 200, description: '이벤트 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 파라미터' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: any,
  ) {
    return this.eventsService.update(id, updateEventDto, req);
  }

  @Delete(':id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '특정 이벤트 삭제 (운영자/관리자)',
    description: 'ID를 사용하여 특정 이벤트를 삭제합니다.',
  })
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiResponse({ status: 200, description: '이벤트 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.eventsService.remove(id, req);
  }
}
