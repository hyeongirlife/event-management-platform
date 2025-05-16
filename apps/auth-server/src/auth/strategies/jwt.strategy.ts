import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';

export interface JwtPayload {
  sub: string; // 일반적으로 사용자 ID (MongoDB _id)
  username: string;
  roles: string[]; // 사용자 역할 배열
  // JWT에 추가하고 싶은 다른 정보들 (iat, exp는 자동으로 추가됨)
}

// req.user에 할당될 객체의 타입 정의 (선택 사항이지만 권장)
export interface AuthenticatedUser {
  userId: string;
  username: string;
  roles: UserRole[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService, // JWT 페이로드의 사용자 ID로 실제 사용자 검증 시 필요
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Authorization: Bearer <token>
      ignoreExpiration: false, // 만료된 토큰은 거부 (true로 설정 시 만료된 토큰도 허용)
      secretOrKey: configService.get<string>('JWT_SECRET'), // .env 파일에서 JWT 시크릿 키
    });
  }

  /**
   * JWT가 유효할 때 호출됩니다.
   * 반환 값은 req.user에 설정됩니다.
   * @param payload JWT 페이로드
   * @returns req.user에 첨부될 사용자 정보 객체
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // console.log('JwtStrategy: validate - payload:', payload);

    // 페이로드의 사용자 ID로 DB에서 사용자가 실제로 존재하는지, 활성화 상태인지 등을 확인합니다.
    const userFromDb = await this.usersService.findUserById(payload.sub);

    if (!userFromDb) {
      // 실제 사용자가 없거나, 삭제/비활성화된 경우
      throw new UnauthorizedException('Token refers to a non-existent user.');
    }

    // (선택 사항) 사용자의 추가 상태 검증 (예: userFromDb.isActive)
    // if (!userFromDb.isActive) {
    //   throw new UnauthorizedException('User is not active.');
    // }

    // payload.roles (string[])를 UserRole[]로 변환
    // 이 변환은 payload.roles의 문자열이 실제 UserRole enum 값과 일치한다고 가정합니다.
    // 더 엄격한 검증을 원하면, 각 role 문자열이 UserRole enum에 실제로 존재하는지 확인할 수 있습니다.
    const validatedRoles = payload.roles.map((roleString) => {
      if (Object.values(UserRole).includes(roleString as UserRole)) {
        return roleString as UserRole;
      }
      // 유효하지 않은 역할 문자열에 대한 처리 (예: 기본 역할 할당, 오류 발생 등)
      // 여기서는 일단 그대로 캐스팅하지만, 실제로는 에러 처리나 필터링이 필요할 수 있습니다.
      // 혹은 JWT 생성 시점에 UserRole[]을 문자열화하고, 여기서 다시 UserRole[]로 변환하는 로직이 안전합니다.
      // 지금은 payload.roles가 이미 UserRole 값들의 문자열 배열이라고 가정합니다.
      return roleString as UserRole;
    });

    // req.user에는 JWT 페이로드에서 파생된 핵심 정보만 포함시킵니다.
    return {
      userId: payload.sub,
      username: payload.username,
      roles: validatedRoles,
    };
  }
}
