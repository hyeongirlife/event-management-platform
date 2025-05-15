import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() 데코레이터는 해당 라우트 핸들러나 컨트롤러가
 * 전역 JWT 인증 가드를 우회하도록 표시합니다.
 * JwtAuthGuard에서 이 메타데이터를 확인하여 인증을 건너뛸지 결정합니다.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
