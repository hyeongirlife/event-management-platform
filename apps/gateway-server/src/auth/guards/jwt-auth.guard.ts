import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'; // Logger 추가
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name); // Logger 인스턴스 생성

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const handler = context.getHandler();
    const controller = context.getClass();

    const handlerMeta = this.reflector.get(IS_PUBLIC_KEY, handler);
    const classMeta = this.reflector.get(IS_PUBLIC_KEY, controller);
    this.logger.debug(
      `[JwtAuthGuard] Handler metadata for IS_PUBLIC_KEY: ${handlerMeta}`,
    );
    this.logger.debug(
      `[JwtAuthGuard] Class metadata for IS_PUBLIC_KEY: ${classMeta}`,
    );

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      controller,
    ]);

    const request = context.switchToHttp().getRequest();
    this.logger.debug(
      `[JwtAuthGuard] Path: ${request.url}, Method: ${request.method}`,
    );
    this.logger.debug(
      `[JwtAuthGuard] Controller: ${context.getClass().name}, Handler: ${context.getHandler().name}`,
    );
    this.logger.debug(`[JwtAuthGuard] isPublic flag evaluated to: ${isPublic}`);

    if (isPublic) {
      this.logger.log(
        `[JwtAuthGuard] Public route detected: ${request.url}. Bypassing JWT Auth.`,
      );
      return true;
    }
    this.logger.log(
      `[JwtAuthGuard] Protected route: ${request.url}. Proceeding with JWT Auth.`,
    );
    return super.canActivate(context);
  }

  // ... (handleRequest 메소드는 그대로 유지)
  handleRequest(err, user, info) {
    if (err || !user) {
      this.logger.warn(
        `[JwtAuthGuard] Authentication Error: ${info?.message || 'No user'}`,
      );
      throw (
        err ||
        new UnauthorizedException('세션이 유효하지 않거나 만료되었습니다.')
      );
    }
    return user;
  }
}
