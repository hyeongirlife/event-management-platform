import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// @Public() 데코레이터: 이 데코레이터가 적용된 핸들러는 JwtAuthGuard를 통과함
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
