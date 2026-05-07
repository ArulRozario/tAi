import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ModelsService } from './models.service';
import { UpdateModelConfigDto } from './dto/model-config.dto';
import { TestModelConnectionDto } from './dto/model-test.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AgentType, Provider } from '@prisma/client';

const ANTHROPIC_MODELS = [
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
];

@Controller('models')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  listConfigs() {
    return this.modelsService.listConfigs();
  }

  @Get('available')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async getAvailableModels(@Query('provider') providerStr?: string) {
    if (!providerStr) {
      throw new BadRequestException('Query parameter "?provider=" is required.');
    }

    const provider = providerStr.toUpperCase() as Provider;
    if (!Object.values(Provider).includes(provider)) {
      throw new BadRequestException(`Invalid provider: '${providerStr}'. Supported: OLLAMA, ANTHROPIC`);
    }

    if (provider === Provider.OLLAMA) {
      const models = await this.modelsService.ollama.listModels();
      return models.map((m) => m.name);
    }

    return ANTHROPIC_MODELS;
  }

  @Put(':agentType')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  updateConfig(
    @Param('agentType') agentTypeStr: string,
    @Body() dto: UpdateModelConfigDto,
  ) {
    const agentType = agentTypeStr.toUpperCase() as AgentType;
    if (!Object.values(AgentType).includes(agentType)) {
      throw new BadRequestException(`Invalid agentType: '${agentTypeStr}'.`);
    }
    return this.modelsService.updateConfig(agentType, dto);
  }

  @Post('test')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  testConnection(@Body() dto: TestModelConnectionDto) {
    return this.modelsService.testConnection(dto);
  }

  @Get(':agentType/logs')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  getAgentLogs(
    @Param('agentType') agentTypeStr: string,
    @Query('limit') limitStr?: string,
  ) {
    const agentType = agentTypeStr.toUpperCase() as AgentType;
    if (!Object.values(AgentType).includes(agentType)) {
      throw new BadRequestException(`Invalid agentType: '${agentTypeStr}'.`);
    }
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    if (isNaN(limit) || limit <= 0) {
      throw new BadRequestException('"limit" must be a positive integer.');
    }
    return this.modelsService.getAgentLogs(agentType, limit);
  }
}
