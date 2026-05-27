import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinIOService } from '../files/minio.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinIOService,
    private readonly http: HttpService,
  ) {}

  @Get()
  async check() {
    const [db, storage, anthropic] = await Promise.all([
      this.checkDb(),
      this.checkStorage(),
      this.checkAnthropic(),
    ]);

    // System is healthy when core services (DB + storage) are up.
    // Anthropic is optional; its absence doesn't degrade overall status.
    const status = [db, storage].every((s) => s === 'ok') ? 'ok' : 'degraded';
    return { status, db, storage, anthropic };
  }

  private async checkDb(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch (err) {
      this.logger.error(`DB health check failed: ${(err as Error).message}`);
      return 'error';
    }
  }

  private async checkStorage(): Promise<string> {
    try {
      await this.minio.listFiles('health-check-probe');
      return 'ok';
    } catch (err) {
      this.logger.error(`Storage health check failed: ${(err as Error).message}`);
      return 'error';
    }
  }

  private async checkAnthropic(): Promise<string> {
    const config = await this.prisma.modelConfig.findFirst({
      where: { provider: 'ANTHROPIC', isActive: true },
    });
    if (!config?.apiKeyEnc) return 'not_configured';

    try {
      await firstValueFrom(
        this.http.get('https://api.anthropic.com/v1/models', {
          timeout: 4000,
          headers: { 'x-api-key': config.apiKeyEnc, 'anthropic-version': '2023-06-01' },
        }),
      );
      return 'ok';
    } catch (err) {
      this.logger.warn(`Anthropic health check failed: ${(err as Error).message}`);
      return 'error';
    }
  }
}
