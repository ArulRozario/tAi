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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
    @Query('limit') limit = '50'
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
  @UseInterceptors(FileInterceptor('file'))
  async bulkCreate(
    @Body() body: any,
    @UploadedFile() file?: any,
  ) {
    const genreId = body.genreId;
    let terms = body.terms;

    if (file) {
      if (!genreId) {
        throw new BadRequestException('genreId is required for bulk CSV import');
      }
      const csvContent = file.buffer.toString('utf-8');
      const lines = csvContent.split(/\r?\n/);
      terms = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(',');
        if (parts.length >= 2) {
          const sourceTerm = parts[0].trim();
          const targetTerm = parts[1].trim();
          const context = parts[2]?.trim();
          if (sourceTerm && targetTerm) {
            terms.push({ sourceTerm, targetTerm, context });
          }
        }
      }
    }

    if (!genreId || !terms || !Array.isArray(terms)) {
      throw new BadRequestException('Invalid bulk import data. Please provide genreId and a list of terms or a CSV file.');
    }

    const res = await this.glossaryService.bulkCreate({ genreId, terms });
    return {
      created: res.created,
      imported: res.created,
    };
  }
}
