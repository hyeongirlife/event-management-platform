import { Controller, Post, Body, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'testuser1', description: '사용자 아이디' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'password123!',
    description: '비밀번호',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'testuser1', description: '사용자 아이디' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'testuser1@example.com', description: '이메일' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

@ApiTags('인증')
@Public()
@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: '사용자 로그인을 수행합니다.',
  })
  @ApiBody({
    description: '로그인 요청 DTO',
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
          example: 'password123!',
          description: '비밀번호',
          format: 'password',
        },
      },
      required: ['username', 'password'],
    },
  })
  @ApiResponse({ status: 200, description: '로그인 성공(JWT 반환)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    return this.authService.login(loginDto, req);
  }

  @Post('register')
  @ApiOperation({
    summary: '회원가입',
    description: '사용자 회원가입을 수행합니다.',
  })
  @ApiBody({
    description: '회원가입 요청 DTO',
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
          description: '이메일',
        },
        password: {
          type: 'string',
          example: 'password123',
          description: '비밀번호',
          format: 'password',
        },
      },
      required: ['username', 'email', 'password'],
    },
  })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async register(@Body() registerDto: RegisterDto, @Req() req: any) {
    return this.authService.register(registerDto, req);
  }
}
