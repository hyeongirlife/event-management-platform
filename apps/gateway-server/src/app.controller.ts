import {
  Controller,
  All,
  Req,
  Res,
  HttpStatus,
  HttpException,
  Post,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
  ApiBody,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { Public } from './auth/decorators/public.decorator';
import { AuthenticatedUser } from './auth/strategies/jwt.strategy';

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
