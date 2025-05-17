import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';
// @Roles(UserRole.ADMIN, UserRole.OPERATOR) 와 같이 사용
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
