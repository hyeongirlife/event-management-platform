import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // @Roles 데코레이터가 없으면 가드를 통과시킴
    }

    const { user } = context.switchToHttp().getRequest();

    // user 객체 또는 user.roles가 없는 경우 (예: JwtAuthGuard가 적용되지 않았거나, 토큰에 역할 정보가 없는 경우)
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
