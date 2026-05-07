import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Custom decorator to mark specific routes as public, bypassing the JwtAuthGuard checking.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
