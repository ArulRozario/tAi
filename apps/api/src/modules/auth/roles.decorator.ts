import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Custom decorator to restrict endpoint access to specific roles (e.g. 'ADMIN', 'MASTER', 'REVIEWER').
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
