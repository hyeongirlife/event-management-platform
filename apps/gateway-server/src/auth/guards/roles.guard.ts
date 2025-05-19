import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';
import { AuthenticatedUser } from '../strategies/jwt.strategy'; // req.user 타입
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'; // IS_PUBLIC_KEY 임포트

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name); // Logger 인스턴스 생성

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const controller = context.getClass();

    // @Public() 데코레이터가 있는지 먼저 확인
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      controller,
    ]);

    const requestUrl = context.switchToHttp().getRequest().url;

    if (isPublic) {
      this.logger.log(
        `[RolesGuard] Pulic 데코레이터가 적용됐습니다. : ${requestUrl}. RoleGuard를 통과합니다.`,
      );
      return true; // Public이면 RolesGuard 통과
    }

    // @Roles() 데코레이터에 설정된 역할들을 가져옴
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [handler, controller],
    );

    // @Roles() 데코레이터가 없으면 역할 검사를 하지 않고 통과 (즉, 인증만 필요)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // JwtAuthGuard에 의해 req.user에 AuthenticatedUser 객체가 주입되었다고 가정
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser; // 타입 단언

    // 사용자가 없거나 사용자에게 역할 정보가 없으면 접근 거부 (Forbidden)
    // JwtAuthGuard가 먼저 실행되므로 user 객체는 존재한다고 가정할 수 있으나, 방어적으로 체크
    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException('역할이 존재하지 않는 유저입니다.');
    }

    // 사용자의 역할 중 하나라도 requiredRoles에 포함되는지 확인
    const hasRequiredRole = requiredRoles.some((role) =>
      user.roles.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        '해당 API에 요구하는 역할과 일치하지 않습니다.',
      );
    }

    return true; // 모든 검사를 통과하면 접근 허용
  }
}
