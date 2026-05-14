import { Controller, Get, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModelRegistryService } from './model-registry.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('agents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentsController {
  constructor(
    private readonly registry: ModelRegistryService,
  ) {}

  @Get('models')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async listModels() {
    return this.registry.getAllModels();
  }

  @Sse('models/stream')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  modelStatusStream(): Observable<{ data: any }> {
    return this.registry.status$.pipe(
      map((event) => ({ data: event })),
    );
  }
}
