import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GlossaryService } from './glossary.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('glossary')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GlossaryController {
  constructor(private readonly glossaryService: GlossaryService) {}

  @Get()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  findMany(
    @Query('genreId') genreId?: string,
    @Query('q') q?: string,
    @Query('limit') limit: string = '50'
  ) {
    return this.glossaryService.findMany({
      genreId,
      q,
      limit: parseInt(limit, 10),
    });
  }

  @Post()
  @Roles('ADMIN', 'MASTER')
  create(
    @Body()
    body: {
      genreId: string;
      sourceTerm: string;
      targetTerm: string;
      context?: string;
      notes?: string;
    }
  ) {
    return this.glossaryService.create(body);
  }

  @Put(':id')
  @Roles('ADMIN', 'MASTER')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { targetTerm?: string; context?: string; notes?: string }
  ) {
    return this.glossaryService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.glossaryService.remove(id);
  }

  @Post('bulk')
  @Roles('ADMIN')
  bulkCreate(
    @Body()
    body: {
      genreId: string;
      terms: Array<{ sourceTerm: string; targetTerm: string; context?: string }>;
    }
  ) {
    return this.glossaryService.bulkCreate(body);
  }
}
