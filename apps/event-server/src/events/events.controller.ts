import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FindAllEventsQueryDto } from './dto/find-all-events-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RolesGuard } from 'src/common/guards';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('이벤트')
@ApiBearerAuth('accessToken')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Post()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '새 이벤트 생성 (운영자/관리자)',
    description: '새로운 이벤트를 시스템에 등록합니다.',
  })
  @ApiResponse({ status: 201, description: '이벤트 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 파라미터' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('사용자 ID가 필요합니다.');
    }
    return this.withTransaction(async (session) => {
      return this.eventsService.create(createEventDto, userId, session);
    });
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
  findAll(@Query() query: FindAllEventsQueryDto) {
    return this.eventsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.AUDITOR, UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '특정 이벤트 상세 조회',
    description: 'ID를 사용하여 특정 이벤트의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '이벤트 상세 정보 조회 성공' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  findOne(@Param('id', new ParseObjectIdPipe()) id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '특정 이벤트 수정 (운영자/관리자)',
    description: 'ID를 사용하여 특정 이벤트를 수정합니다.',
  })
  @ApiResponse({ status: 200, description: '이벤트 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 파라미터' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('사용자 ID가 필요합니다.');
    }
    return this.withTransaction(async (session) => {
      return this.eventsService.update(id, updateEventDto, userId, session);
    });
  }

  @Delete(':id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '특정 이벤트 삭제 (운영자/관리자)',
    description: 'ID를 사용하여 특정 이벤트를 삭제합니다.',
  })
  @ApiResponse({ status: 200, description: '이벤트 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('사용자 ID가 필요합니다.');
    }
    return this.withTransaction(async (session) => {
      return this.eventsService.remove(id, userId, session);
    });
  }

  private async withTransaction<T>(fn: (session) => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result;
    } finally {
      session.endSession();
    }
  }
}
