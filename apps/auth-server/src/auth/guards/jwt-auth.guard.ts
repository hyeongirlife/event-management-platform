import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'; // Public 데코레이터에서 export한 키

/**
 * 'jwt' Passport 전략을 사용하는 전역 Guard입니다.
 * 요청 헤더의 JWT를 검증하여 인증을 수행합니다.
 * IS_PUBLIC_KEY 메타데이터가 설정된 핸들러나 컨트롤러는 인증을 건너뜁니다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // IS_PUBLIC_KEY 메타데이터를 확인하여 public으로 표시되었는지 확인
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // 현재 요청의 핸들러 (메소드 레벨)
      context.getClass(), // 현재 요청의 컨트롤러 (클래스 레벨)
    ]);

    if (isPublic) {
      // @Public() 데코레이터가 있으면 인증을 건너뜀
      return true;
    }

    // @Public() 데코레이터가 없으면 부모 클래스(AuthGuard('jwt'))의 canActivate를 호출하여 JWT 인증 수행
    return super.canActivate(context);
  }

  // handleRequest 메소드를 오버라이드하여 인증 실패 시 기본 동작을 변경할 수 있습니다.
  // (예: 커스텀 예외 던지기, 특정 에러 코드 반환 등)
  // AuthGuard('jwt')는 기본적으로 인증 실패 시 401 UnauthorizedException을 던집니다.
  // handleRequest(err, user, info, context, status) {
  //   if (err || !user) {
  //     // console.error('JwtAuthGuard: 인증 실패', info);
  //     throw err || new UnauthorizedException('유효하지 않은 토큰이거나 권한이 없습니다.');
  //   }
  //   return user; // 인증된 사용자 객체 반환 (req.user에 설정됨)
  // }
}
