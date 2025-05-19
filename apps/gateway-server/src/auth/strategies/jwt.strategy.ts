import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../enums/user-role.enum'; // 방금 생성한 Enum

// JWT 페이로드 타입 정의 (AuthServer의 것과 일치해야 함)
interface JwtPayload {
  username: string;
  sub: string; // userId
  roles: UserRole[];
}

// PassportStrategy가 검증 후 req.user에 주입할 사용자 객체 타입
export interface AuthenticatedUser {
  userId: string;
  username: string;
  roles: UserRole[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Authorization: Bearer <token>
      ignoreExpiration: false, // 만료된 토큰은 거부
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // JWT 검증 성공 시 호출됨
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // payload에는 토큰 생성 시 넣었던 정보가 들어있음 (iat, exp 등은 자동으로 처리됨)
    // 여기서 추가적인 사용자 검증 로직(예: DB에서 사용자 활성 상태 확인)을 넣을 수도 있지만,
    // Gateway에서는 주로 토큰 자체의 유효성과 페이로드의 존재 유무를 확인합니다.
    // AuthServer에서 이미 사용자 검증 후 토큰을 발급했으므로, 여기서는 페이로드 내용을 신뢰합니다.
    if (!payload || !payload.sub || !payload.username || !payload.roles) {
      throw new UnauthorizedException('Invalid token payload');
    }

    console.log('payload', payload);

    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles,
    };
  }
}
