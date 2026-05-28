import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AssignProjectDto,
} from './dto/collection.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('collections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * Returns the full collection tree.
   * Pass ?rootId=<uuid> to get a sub-tree rooted at a specific collection.
   * Authorized: all authenticated roles.
   */
  @Get()
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  getTree(@Query('rootId') rootId?: string) {
    return this.collectionsService.getTree(rootId);
  }

  /**
   * Returns a single collection (flat, no recursive children).
   * Authorized: all authenticated roles.
   */
  @Get(':id')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.collectionsService.findOne(id);
  }

  /**
   * Creates a new collection.
   * Authorized: ADMIN, MASTER.
   */
  @Post()
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto);
  }

  /**
   * Updates a collection's properties or moves it in the tree.
   * Cycle detection prevents moving a node into its own subtree.
   * Pass parentId: null to promote the node to root level.
   * Authorized: ADMIN, MASTER.
   */
  @Patch(':id')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(id, dto);
  }

  /**
   * Deletes a collection.
   * Direct children are re-parented to the deleted node's parent.
   * Projects inside are unlinked (collectionId → null).
   * Authorized: ADMIN only.
   */
  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.collectionsService.remove(id);
  }

  /**
   * Moves a project into a collection (or out of one when collectionId is null).
   * Authorized: ADMIN, MASTER.
   */
  @Patch('projects/:projectId/assign')
  @Roles('ADMIN', 'MASTER')
  @HttpCode(HttpStatus.OK)
  assignProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AssignProjectDto,
  ) {
    return this.collectionsService.assignProject(
      projectId,
      dto.collectionId ?? null,
    );
  }
}
