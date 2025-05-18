import {
  Controller,
  All,
  Req,
  Res,
  HttpStatus,
  HttpException,
  Post,
  Get,
  Body,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { Public } from './auth/decorators/public.decorator';
import { AuthenticatedUser } from './auth/strategies/jwt.strategy';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// 요청 본문을 위한 DTO
class TriggerEventDto {
  @ApiProperty({ example: 'Gateway Test Event', description: '이벤트 이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Event triggered from Gateway',
    description: '이벤트 설명',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Trigger condition', description: '이벤트 조건' })
  @IsString()
  @IsNotEmpty()
  condition: string;

  @ApiProperty({
    example: '2024-10-01T00:00:00.000Z',
    description: '시작일 (ISO 8601)',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    example: '2024-10-31T23:59:59.999Z',
    description: '종료일 (ISO 8601)',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({ example: 'SCHEDULED', description: '이벤트 상태' })
  @IsOptional()
  @IsString() // EventStatus Enum 대신 string으로 간단히 처리
  status?: string;
}

// Gateway용 FindAllEventsQueryDto
class GatewayFindAllEventsQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
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
  limit?: number;

  @ApiPropertyOptional({ description: '정렬 필드', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: '정렬 순서',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: '이벤트 이름 필터' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '이벤트 상태 필터 (SCHEDULED, ACTIVE, ENDED, CANCELLED)',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: '시작일 필터 (이후, ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDateAfter?: string;

  @ApiPropertyOptional({
    description: '시작일 필터 (이전, ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDateBefore?: string;

  @ApiPropertyOptional({
    description: '종료일 필터 (이후, ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDateAfter?: string;

  @ApiPropertyOptional({
    description: '종료일 필터 (이전, ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDateBefore?: string;
}

// Gateway용 UpdateEventDto
class GatewayUpdateEventDto {
  @ApiPropertyOptional({ description: '이벤트 이름' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '이벤트 상세 설명' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '이벤트 참여/보상 조건' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({
    description: '이벤트 시작 일시 (ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '이벤트 종료 일시 (ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '이벤트 상태 (SCHEDULED, ACTIVE, ENDED, CANCELLED)',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

@ApiTags('게이트웨이')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Post('/auth/login')
  @ApiOperation({
    summary: '사용자 로그인 (인증 서비스로 프록시)',
    description:
      '로그인 요청을 인증 서비스로 프록시합니다. 요청 본문에 자격 증명을 포함해야 하며, 인증 성공 시 JWT를 반환합니다.',
    tags: ['인증'],
  })
  @ApiBody({
    description: '사용자 로그인 정보',
    required: true,
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          example: 'testuser1',
          description: '사용자 아이디',
        },
        password: {
          type: 'string',
          example: 'password123',
          description: '사용자 비밀번호',
          format: 'password',
        },
      },
      required: ['username', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공, JWT 반환됨 (구조는 인증 서비스에 따라 다름)',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (예: 필드 누락)',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (예: 잘못된 자격 증명)',
  })
  async login(@Req() req: Request, @Res() res: Response) {
    await this.handleProxy(req as Request & { user?: AuthenticatedUser }, res);
  }

  @Public()
  @Post('/auth/register')
  @ApiOperation({
    summary: '사용자 회원가입 (인증 서비스로 프록시)',
    description:
      '회원가입 요청을 인증 서비스로 프록시합니다. 요청 본문에 사용자 상세 정보를 포함해야 합니다.',
    tags: ['인증'],
  })
  @ApiBody({
    description: '사용자 회원가입 정보',
    required: true,
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          example: 'testuser1',
          description: '사용자 아이디',
        },
        email: {
          type: 'string',
          example: 'testuser1@example.com',
          description: '사용자 이메일',
        },
        password: {
          type: 'string',
          example: 'password123',
          description: '사용자 비밀번호',
          format: 'password',
        },
      },
      required: ['username', 'email', 'password'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공 (구조는 인증 서비스에 따라 다름)',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (예: 잘못된 입력, 이미 존재하는 사용자)',
  })
  async register(@Req() req: Request, @Res() res: Response) {
    await this.handleProxy(req as Request & { user?: AuthenticatedUser }, res);
  }

  @Public()
  @Get('/')
  @ApiOperation({
    summary: '게이트웨이 루트 경로 확인',
    description:
      '게이트웨이 서버의 루트 경로입니다. 간단한 환영 메시지와 함께 API 문서 경로를 안내합니다.',
    tags: ['게이트웨이'],
  })
  @ApiResponse({
    status: 200,
    description: '게이트웨이 루트 응답',
    schema: {
      example: {
        message: 'Event Platform API Gateway is running.',
        apiDocs: '/api/v1/api-docs',
        healthCheck: '/api/v1/health',
      },
    },
  })
  async gatewayRoot(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      message: 'Event Platform API Gateway is running.',
      apiDocs: '/api/v1/api-docs',
      healthCheck: '/api/v1/health',
    });
  }

  @Post('events')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Event Server 이벤트 생성 요청 (게이트웨이 경유)',
    description:
      '인증된 사용자를 대신하여 Event Server에 새로운 이벤트 생성을 요청합니다. 게이트웨이를 통해 `x-user-id`가 Event Server로 전달됩니다.',
    tags: ['이벤트'],
  })
  @ApiBody({ type: TriggerEventDto })
  @ApiResponse({
    status: 201,
    description: 'Event Server로부터 이벤트 생성 성공 응답',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: 'Event Server 호출 중 오류 발생' })
  async triggerEventCreation(
    @Req() req: Request & { user?: AuthenticatedUser },
    @Body() triggerEventDto: TriggerEventDto,
  ) {
    if (!req.user || !req.user.userId) {
      throw new HttpException(
        '인증된 사용자 정보가 없습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.appService.triggerEventCreationOnEventServer(
      req.user.userId,
      triggerEventDto,
    );
  }

  @Get('events')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Event Server 모든 이벤트 조회 (게이트웨이 경유)',
    description:
      'Event Server의 모든 이벤트를 페이지네이션, 필터링, 정렬 옵션과 함께 조회합니다.',
    tags: ['이벤트'],
  })
  @ApiQuery({ type: GatewayFindAllEventsQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Event Server로부터 이벤트 목록 조회 성공',
  })
  @ApiResponse({ status: 500, description: 'Event Server 호출 중 오류 발생' })
  async findAllEvents(@Query() query: GatewayFindAllEventsQueryDto) {
    return this.appService.findAllEventsOnEventServer(query);
  }

  @Get('events/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Event Server 특정 이벤트 상세 조회 (게이트웨이 경유)',
    description:
      'ID를 사용하여 Event Server의 특정 이벤트 상세 정보를 조회합니다.',
    tags: ['이벤트'],
  })
  @ApiParam({ name: 'id', description: '조회할 이벤트의 ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Event Server로부터 이벤트 상세 정보 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: 'Event Server에서 해당 이벤트를 찾을 수 없음',
  })
  @ApiResponse({ status: 500, description: 'Event Server 호출 중 오류 발생' })
  async findOneEvent(@Param('id') id: string) {
    return this.appService.findOneEventOnEventServer(id);
  }

  @Patch('events/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Event Server 특정 이벤트 수정 (게이트웨이 경유)',
    description: 'ID를 사용하여 Event Server의 특정 이벤트를 수정합니다.',
    tags: ['이벤트'],
  })
  @ApiParam({ name: 'id', description: '수정할 이벤트의 ID', type: String })
  @ApiBody({ type: GatewayUpdateEventDto })
  @ApiResponse({
    status: 200,
    description: 'Event Server로부터 이벤트 수정 성공 응답',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({
    status: 404,
    description: 'Event Server에서 해당 이벤트를 찾을 수 없음',
  })
  @ApiResponse({ status: 500, description: 'Event Server 호출 중 오류 발생' })
  async updateEvent(
    @Param('id') id: string,
    @Req() req: Request & { user?: AuthenticatedUser },
    @Body() updateDto: GatewayUpdateEventDto,
  ) {
    if (!req.user || !req.user.userId) {
      throw new HttpException(
        '인증된 사용자 정보가 없습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.appService.updateEventOnEventServer(
      id,
      req.user.userId,
      updateDto,
    );
  }

  @Delete('events/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Event Server 특정 이벤트 삭제 (게이트웨이 경유)',
    description:
      'ID를 사용하여 Event Server의 특정 이벤트를 논리적으로 삭제합니다.',
    tags: ['이벤트'],
  })
  @ApiParam({ name: 'id', description: '삭제할 이벤트의 ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Event Server로부터 이벤트 삭제 성공 응답',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({
    status: 404,
    description: 'Event Server에서 해당 이벤트를 찾을 수 없음',
  })
  @ApiResponse({ status: 500, description: 'Event Server 호출 중 오류 발생' })
  async removeEvent(
    @Param('id') id: string,
    @Req() req: Request & { user?: AuthenticatedUser },
  ) {
    if (!req.user || !req.user.userId) {
      throw new HttpException(
        '인증된 사용자 정보가 없습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.appService.removeEventOnEventServer(id, req.user.userId);
  }

  @All('*')
  @ApiExcludeEndpoint()
  async proxyAllOtherRequests(@Req() req: Request, @Res() res: Response) {
    await this.handleProxy(req as Request & { user?: AuthenticatedUser }, res);
  }

  private async handleProxy(
    req: Request & { user?: AuthenticatedUser },
    res: Response,
  ) {
    try {
      const result = await this.appService.proxyRequest(req);
      if (result.headers) {
        for (const key in result.headers) {
          if (Object.prototype.hasOwnProperty.call(result.headers, key)) {
            if (key.toLowerCase() !== 'transfer-encoding') {
              res.setHeader(key, result.headers[key]);
            }
          }
        }
      }
      res.status(result.status).json(result.data);
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json(error.getResponse());
      } else {
        const statusCode =
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
          error.response?.data || error.message || 'Internal server error';
        res.status(statusCode).json({ statusCode, message });
      }
    }
  }
}
