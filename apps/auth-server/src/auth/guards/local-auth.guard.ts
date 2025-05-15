import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * 'local' Passport 전략을 사용하는 Guard입니다.
 * HTTP 요청의 body에서 username과 password를 추출하여 인증을 시도합니다.
 * AuthService의 validateUser 메소드를 내부적으로 호출합니다.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // canActivate 메소드를 오버라이드하여 추가적인 로직을 넣을 수 있습니다.
  // 예를 들어, 요청 로깅 또는 특정 조건에 따른 인증 건너뛰기 등.
  // 기본적으로 AuthGuard('local')이 Passport-local 전략을 실행하고,
  // 성공하면 true를 반환하여 요청 처리를 계속하고,
  // 실패하면 401 Unauthorized 예외를 자동으로 던집니다.
  // 성공 시, Passport는 req.user에 사용자 객체를 설정합니다.

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 여기에서 부모 클래스의 canActivate를 호출하기 전에
    // 예를 들어, 요청에 특정 헤더가 있는지 확인하는 등의 로직을 추가할 수 있습니다.
    // console.log('LocalAuthGuard: canActivate');

    // 부모 클래스의 canActivate 로직을 실행 (이것이 실제 Passport 인증을 트리거)
    return super.canActivate(context);
  }

  // handleRequest 메소드를 오버라이드하여 인증 성공/실패 시의 기본 동작을 변경할 수 있습니다.
  // 예를 들어, 커스텀 예외를 던지거나 반환 값을 조작할 수 있습니다.
  // handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
  //   if (err || !user) {
  //     // console.error('LocalAuthGuard: handleRequest - 인증 실패', err, info);
  //     throw err || new UnauthorizedException('인증에 실패했습니다.');
  //   }
  //   // console.log('LocalAuthGuard: handleRequest - 인증 성공', user);
  //   return user; // 인증된 사용자 객체 반환 (req.user에 설정됨)
  // }
}
