import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { AuthenticatedUser } from './strategies/jwt.strategy';
import { UserRole } from '../users/enums/user-role.enum';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { LoginDto } from './dto/login.dto';
import { ApiProperty } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

interface UserFromLocalStrategy {
  _id: string;
  username: string;
  roles: UserRole[];
}

class LoginResponse {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;
}

class UserProfileResponse implements AuthenticatedUser {
  @ApiProperty({
    example: '60c72b2f9b1e8a001c8e4d1a',
    description: '사용자 고유 ID',
  })
  userId: string;

  @ApiProperty({ example: 'testuser1', description: '사용자 이름' })
  username: string;

  @ApiProperty({
    example: [UserRole.USER],
    description: '사용자 역할',
    enum: UserRole,
    isArray: true,
    enumName: 'UserRole',
  })
  roles: UserRole[];
}

class AdminTestResponse {
  @ApiProperty({ example: 'Admin test successful' })
  message: string;

  @ApiProperty({ type: UserProfileResponse })
  user: UserProfileResponse;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '신규 사용자 등록',
    description: '새로운 사용자 계정을 생성합니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '사용자 등록 성공. 비밀번호를 제외한 사용자 정보 반환.',
    type: CreateUserDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '사용자 이름 또는 이메일 중복',
  })
  async register(@Body() createUserDto: CreateUserDto) {
    const session = await this.connection.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await this.authService.register(createUserDto, session);
      });
      return result;
    } finally {
      session.endSession();
    }
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '사용자 로그인',
    description: '사용자 이름과 비밀번호로 로그인하고 JWT를 발급받습니다.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '로그인 성공. JWT 액세스 토큰 발급.',
    type: LoginResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '아이디 또는 비밀번호 불일치',
  })
  async login(
    @Request() req: { user: UserFromLocalStrategy },
  ): Promise<LoginResponse> {
    return this.authService.login(req.user);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '로그인된 사용자 프로필 조회',
    description: '현재 로그인된 사용자의 프로필 정보를 반환합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '프로필 정보 조회 성공.',
    type: UserProfileResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자 (토큰 없음 또는 유효하지 않음)',
  })
  getProfile(@Request() req: { user: AuthenticatedUser }): UserProfileResponse {
    return req.user;
  }

  @Get('admin/test')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '관리자 전용 테스트 엔드포인트',
    description: 'ADMIN 역할 사용자만 접근 가능한 테스트 엔드포인트입니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '관리자 테스트 성공.',
    type: AdminTestResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '권한 없음 (ADMIN 역할 아님)',
  })
  adminTest(@Request() req: { user: AuthenticatedUser }): AdminTestResponse {
    return {
      message: 'Admin test successful',
      user: req.user as UserProfileResponse,
    };
  }
}
