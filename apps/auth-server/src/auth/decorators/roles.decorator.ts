import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * @Roles() 데코레이터는 해당 라우트 핸들러나 컨트롤러에 접근하는 데 필요한 역할을 지정합니다.
 * RolesGuard에서 이 메타데이터를 확인하여 권한을 검사합니다.
 * @param roles 필요한 역할들 (UserRole enum의 배열)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
