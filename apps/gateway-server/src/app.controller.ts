// import {
//   Controller,
//   Post,
//   Get,
//   Body,
//   Query,
//   Param,
//   Patch,
//   Delete,
//   Res,
//   HttpStatus,
// } from '@nestjs/common';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBody,
//   ApiBearerAuth,
//   ApiParam,
//   ApiQuery,
// } from '@nestjs/swagger';
// import { AppService } from './app.service';
// import { Response } from 'express';
// import { Public } from './auth/decorators/public.decorator';
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import {
//   IsString,
//   IsNotEmpty,
//   IsOptional,
//   IsDateString,
//   IsInt,
//   Min,
//   Max,
//   IsEnum,
//   MinLength,
//   MaxLength,
// } from 'class-validator';
// import { Type } from 'class-transformer';

// // 요청 본문을 위한 DTO
// class TriggerEventDto {
//   @ApiProperty({ example: 'Gateway Test Event', description: '이벤트 이름' })
//   @IsString()
//   @IsNotEmpty()
//   name: string;

//   @ApiPropertyOptional({
//     example: 'Event triggered from Gateway',
//     description: '이벤트 설명',
//   })
//   @IsOptional()
//   @IsString()
//   description?: string;

//   @ApiProperty({ example: 'Trigger condition', description: '이벤트 조건' })
//   @IsString()
//   @IsNotEmpty()
//   condition: string;

//   @ApiProperty({
//     example: '2024-10-01T00:00:00.000Z',
//     description: '시작일 (ISO 8601)',
//   })
//   @IsDateString()
//   @IsNotEmpty()
//   startDate: string;

//   @ApiProperty({
//     example: '2024-10-31T23:59:59.999Z',
//     description: '종료일 (ISO 8601)',
//   })
//   @IsDateString()
//   @IsNotEmpty()
//   endDate: string;

//   @ApiPropertyOptional({ example: 'SCHEDULED', description: '이벤트 상태' })
//   @IsOptional()
//   @IsString() // EventStatus Enum 대신 string으로 간단히 처리
//   status?: string;
// }

// // Gateway용 FindAllEventsQueryDto
// class GatewayFindAllEventsQueryDto {
//   @ApiPropertyOptional({
//     description: '페이지 번호',
//     default: 1,
//     type: Number,
//   })
//   @IsOptional()
//   @Type(() => Number)
//   @IsInt()
//   @Min(1)
//   page?: number;

//   @ApiPropertyOptional({
//     description: '페이지당 항목 수',
//     default: 10,
//     type: Number,
//     minimum: 1,
//     maximum: 100,
//   })
//   @IsOptional()
//   @Type(() => Number)
//   @IsInt()
//   @Min(1)
//   @Max(100)
//   limit?: number;

//   @ApiPropertyOptional({ description: '정렬 필드', example: 'createdAt' })
//   @IsOptional()
//   @IsString()
//   sortBy?: string;

//   @ApiPropertyOptional({
//     description: '정렬 순서',
//     enum: ['ASC', 'DESC'],
//     default: 'DESC',
//   })
//   @IsOptional()
//   @IsEnum(['ASC', 'DESC'])
//   sortOrder?: 'ASC' | 'DESC';

//   @ApiPropertyOptional({ description: '이벤트 이름 필터' })
//   @IsOptional()
//   @IsString()
//   name?: string;

//   @ApiPropertyOptional({
//     description: '이벤트 상태 필터 (SCHEDULED, ACTIVE, ENDED, CANCELLED)',
//   })
//   @IsOptional()
//   @IsString()
//   status?: string;

//   @ApiPropertyOptional({
//     description: '시작일 필터 (이후, ISO 8601)',
//     type: String,
//     format: 'date-time',
//   })
//   @IsOptional()
//   @IsDateString()
//   startDateAfter?: string;

//   @ApiPropertyOptional({
//     description: '시작일 필터 (이전, ISO 8601)',
//     type: String,
//     format: 'date-time',
//   })
//   @IsOptional()
//   @IsDateString()
//   startDateBefore?: string;

//   @ApiPropertyOptional({
//     description: '종료일 필터 (이후, ISO 8601)',
//     type: String,
//     format: 'date-time',
//   })
//   @IsOptional()
//   @IsDateString()
//   endDateAfter?: string;

//   @ApiPropertyOptional({
//     description: '종료일 필터 (이전, ISO 8601)',
//     type: String,
//     format: 'date-time',
//   })
//   @IsOptional()
//   @IsDateString()
//   endDateBefore?: string;
// }

// // Gateway용 UpdateEventDto
// class GatewayUpdateEventDto {
//   @ApiPropertyOptional({ description: '이벤트 이름' })
//   @IsOptional()
//   @IsString()
//   @MinLength(3)
//   @MaxLength(100)
//   name?: string;

//   @ApiPropertyOptional({ description: '이벤트 상세 설명' })
//   @IsOptional()
//   @IsString()
//   @MaxLength(500)
//   description?: string;

//   @ApiPropertyOptional({ description: '이벤트 참여/보상 조건' })
//   @IsOptional()
//   @IsString()
//   condition?: string;

//   @ApiPropertyOptional({
//     description: '이벤트 시작 일시 (ISO 8601)',
//     type: String,
//     format: 'date-time',
//   })
//   @IsOptional()
//   @IsDateString()
//   startDate?: string;

//   @ApiPropertyOptional({
//     description: '이벤트 종료 일시 (ISO 8601)',
//     type: String,
//     format: 'date-time',
//   })
//   @IsOptional()
//   @IsDateString()
//   endDate?: string;

//   @ApiPropertyOptional({
//     description: '이벤트 상태 (SCHEDULED, ACTIVE, ENDED, CANCELLED)',
//   })
//   @IsOptional()
//   @IsString()
//   status?: string;
// }

// @ApiTags('게이트웨이')
// @Controller()
// export class AppController {
//   constructor(private readonly appService: AppService) {}

//   @Public()
//   @Get('/')
//   @ApiOperation({
//     summary: '게이트웨이 루트 경로 확인',
//     description:
//       '게이트웨이 서버의 루트 경로입니다. 간단한 환영 메시지와 함께 API 문서 경로를 안내합니다.',
//     tags: ['게이트웨이'],
//   })
//   @ApiResponse({
//     status: 200,
//     description: '게이트웨이 루트 응답',
//     schema: {
//       example: {
//         message: 'Event Platform API Gateway is running.',
//         apiDocs: '/api/v1/api-docs',
//         healthCheck: '/api/v1/health',
//       },
//     },
//   })
//   async gatewayRoot(@Res() res: Response) {
//     return res.status(HttpStatus.OK).json({
//       message: 'Event Platform API Gateway is running.',
//       apiDocs: '/api/v1/api-docs',
//       healthCheck: '/api/v1/health',
//     });
//   }

//   @Post('events')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Event Server 이벤트 생성 요청 (게이트웨이 경유)',
//     description:
//       '인증된 사용자를 대신하여 Event Server에 새로운 이벤트 생성을 요청합니다. 게이트웨이를 통해 `x-user-id`가 Event Server로 전달됩니다.',
//     tags: ['이벤트'],
//   })
//   @ApiBody({ type: TriggerEventDto })
//   @ApiResponse({
//     status: 201,
//     description: 'Event Server로부터 이벤트 생성 성공 응답',
//   })
//   @ApiResponse({ status: 401, description: '인증 실패' })
//   @ApiResponse({ status: 500, description: 'Event Server 호출 중 오류 발생' })
//   async triggerEventCreation(
//     @Body() triggerEventDto: TriggerEventDto,
//     @Res() res: Response,
//   ) {
//     // 인증 정보는 실제 인증 미들웨어/가드에서 처리됨
//     // userId는 미들웨어에서 req.user로 주입받는 구조로 리팩터링 필요
//     // 여기서는 예시로만 남김
//     // 실제 구현에서는 도메인별 컨트롤러에서 처리하는 것이 더 좋음
//     return res.status(HttpStatus.NOT_IMPLEMENTED).json({
//       message: '이 엔드포인트는 도메인별 컨트롤러로 이전되었습니다.',
//     });
//   }

//   @Get('events')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Event Server 모든 이벤트 조회 (게이트웨이 경유)',
//     description:
//       'Event Server의 모든 이벤트를 페이지네이션, 필터링, 정렬 옵션과 함께 조회합니다.',
//     tags: ['이벤트'],
//   })
//   @ApiQuery({ type: GatewayFindAllEventsQueryDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Event Server로부터 이벤트 목록 조회 성공',
//   })
//   @ApiResponse({ status: 500, description: 'Event Server 호출 중 오류 발생' })
//   async findAllEvents(@Query() query: GatewayFindAllEventsQueryDto) {
//     return this.appService.findAllEventsOnEventServer(query);
//   }

//   @Get('events/:id')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Event Server 특정 이벤트 상세 조회 (게이트웨이 경유)',
//     description:
//       'ID를 사용하여 Event Server의 특정 이벤트 상세 정보를 조회합니다.',
//     tags: ['이벤트'],
//   })
//   @ApiParam({ name: 'id', description: '조회할 이벤트의 ID', type: String })
//   @ApiResponse({
//     status: 200,
//     description: 'Event Server로부터 이벤트 상세 정보 조회 성공',
//   })
//   @ApiResponse({
//     status: 404,
//     description: 'Event Server에서 해당 이벤트를 찾을 수 없음',
//   })
//   @ApiResponse({ status: 500, description: 'Event Server 호출 중 오류 발생' })
//   async findOneEvent(@Param('id') id: string) {
//     return this.appService.findOneEventOnEventServer(id);
//   }

//   @Patch('events/:id')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Event Server 특정 이벤트 수정 (게이트웨이 경유)',
//     description: 'ID를 사용하여 Event Server의 특정 이벤트를 수정합니다.',
//     tags: ['이벤트'],
//   })
//   @ApiParam({ name: 'id', description: '수정할 이벤트의 ID', type: String })
//   @ApiBody({ type: GatewayUpdateEventDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Event Server로부터 이벤트 수정 성공 응답',
//   })
//   @ApiResponse({ status: 401, description: '인증 실패' })
//   @ApiResponse({
//     status: 404,
//     description: 'Event Server에서 해당 이벤트를 찾을 수 없음',
//   })
//   @ApiResponse({ status: 500, description: 'Event Server 호출 중 오류 발생' })
//   async updateEvent(
//     @Param('id') id: string,
//     @Body() updateDto: GatewayUpdateEventDto,
//     @Res() res: Response,
//   ) {
//     // 인증 정보는 실제 인증 미들웨어/가드에서 처리됨
//     // userId는 미들웨어에서 req.user로 주입받는 구조로 리팩터링 필요
//     // 여기서는 예시로만 남김
//     // 실제 구현에서는 도메인별 컨트롤러에서 처리하는 것이 더 좋음
//     return res.status(HttpStatus.NOT_IMPLEMENTED).json({
//       message: '이 엔드포인트는 도메인별 컨트롤러로 이전되었습니다.',
//     });
//   }

//   @Delete('events/:id')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Event Server 특정 이벤트 삭제 (게이트웨이 경유)',
//     description:
//       'ID를 사용하여 Event Server의 특정 이벤트를 논리적으로 삭제합니다.',
//     tags: ['이벤트'],
//   })
//   @ApiParam({ name: 'id', description: '삭제할 이벤트의 ID', type: String })
//   @ApiResponse({
//     status: 200,
//     description: 'Event Server로부터 이벤트 삭제 성공 응답',
//   })
//   @ApiResponse({ status: 401, description: '인증 실패' })
//   @ApiResponse({
//     status: 404,
//     description: 'Event Server에서 해당 이벤트를 찾을 수 없음',
//   })
//   @ApiResponse({ status: 500, description: 'Event Server 호출 중 오류 발생' })
//   async removeEvent(@Param('id') id: string, @Res() res: Response) {
//     // 인증 정보는 실제 인증 미들웨어/가드에서 처리됨
//     // userId는 미들웨어에서 req.user로 주입받는 구조로 리팩터링 필요
//     // 여기서는 예시로만 남김
//     // 실제 구현에서는 도메인별 컨트롤러에서 처리하는 것이 더 좋음
//     return res.status(HttpStatus.NOT_IMPLEMENTED).json({
//       message: '이 엔드포인트는 도메인별 컨트롤러로 이전되었습니다.',
//     });
//   }
// }
