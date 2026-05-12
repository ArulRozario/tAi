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
    const [db, minio, ollama, anthropic] = await Promise.all([
      this.checkDb(),
      this.checkMinio(),
      this.checkOllama(),
      this.checkAnthropic(),
    ]);

    const status = [db, minio, ollama].every((s) => s === 'ok') ? 'ok' : 'degraded';
    return { status, db, minio, ollama, anthropic };
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

  private async checkMinio(): Promise<string> {
    try {
      await this.minio.listFiles('health-check-probe');
      return 'ok';
    } catch (err) {
      this.logger.error(`MinIO health check failed: ${(err as Error).message}`);
      return 'error';
    }
  }

  private async checkOllama(): Promise<string> {
    try {
      const url = process.env.OLLAMA_API_URL || 'http://localhost:11434';
      await firstValueFrom(this.http.get(`${url}/api/tags`, { timeout: 3000 }));
      return 'ok';
    } catch (err) {
      this.logger.warn(`Ollama health check failed: ${(err as Error).message}`);
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
