import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserRole } from '../../users/enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../strategies/jwt.strategy'; // req.user 타입

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // ROLES_KEY 메타데이터를 통해 핸들러/컨트롤러에 필요한 역할을 가져옵니다.
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [
        context.getHandler(), // 현재 요청의 핸들러 (메소드 레벨)
        context.getClass(), // 현재 요청의 컨트롤러 (클래스 레벨)
      ],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      // 필요한 역할이 정의되지 않았다면, 접근을 허용합니다.
      // (또는 특정 정책에 따라 접근을 거부할 수도 있습니다.)
      // 이 가드는 역할이 명시된 경우에만 작동하도록 설계합니다.
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user; // JwtAuthGuard가 설정한 req.user

    if (!user || !user.roles) {
      // 사용자 정보나 역할 정보가 없으면 접근 거부
      throw new ForbiddenException(
        '접근 권한이 없습니다. 사용자 역할 정보를 찾을 수 없습니다.',
      );
    }

    // 사용자가 필요한 역할 중 하나라도 가지고 있는지 확인합니다.
    const hasRequiredRole = requiredRoles.some((role) =>
      user.roles.includes(role),
    );

    if (hasRequiredRole) {
      return true;
    }

    throw new ForbiddenException(
      `접근 권한이 없습니다. 다음 역할 중 하나가 필요합니다: ${requiredRoles.join(', ')}`,
    );
  }
}
