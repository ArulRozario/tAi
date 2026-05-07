import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  ForbiddenException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Retrieve the required roles metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access (open to any authenticated user)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. Fetch user context from request (must be populated by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User context is missing');
    }

    // 3. Enforce role membership
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Your role '${user.role}' is insufficient to access this resource.`
      );
    }

    return true;
  }
}
