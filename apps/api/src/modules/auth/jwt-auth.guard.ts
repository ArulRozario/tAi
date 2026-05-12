import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  UnauthorizedException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if the route has the @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Extract Bearer token — header for normal requests, ?token= query param for SSE/image
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    let token: string | undefined;

    if (authHeader) {
      const [type, headerToken] = authHeader.split(' ');
      if (type !== 'Bearer' || !headerToken) {
        throw new UnauthorizedException('Invalid authorization header format. Expected Bearer <token>');
      }
      token = headerToken;
    } else if (request.query?.token) {
      token = request.query.token as string;
    } else {
      throw new UnauthorizedException('Authorization header is missing');
    }

    // 3. Verify JWT token
    try {
      const payload = await this.jwtService.verifyAsync(token);
      
      // Attach the user identity payload to the request object (mapping sub to id for ergonomic usage)
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
