import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
// Value-import (not `import type`) — @Body() / @Query() types are
// read by NestJS at runtime via `design:paramtypes` to instantiate
// the ValidationPipe target class. Erasing the class with a type-only
// import breaks the pipe (see wedding-planners.controller.ts).
import {
  CreateWeddingDto,
  ListWeddingsQueryDto,
  type ListWeddingsResponseDto,
  PutWeddingLocationsDto,
  UpdateWeddingDto,
  WeddingDto,
} from '@wendy/contracts';

import { Roles } from '../../../shared/decorators/auth.decorators';
import { CurrentUser, type AuthenticatedUser } from '../../../shared/decorators/current-user.decorator';
import {
  ValidationError,
  WeddingsService,
  WeddingNotFoundError,
} from '../application/weddings.service';

@Controller('api/v1/weddings')
export class WeddingsController {
  private readonly logger = new Logger(WeddingsController.name);

  constructor(private readonly weddingsService: WeddingsService) {}

  // No @Roles: the service owns the role-aware scope (WP→own rows,
  // Admin→whole tenant) so the controller stays a thin HTTP adapter.
  @Get()
  async list(
    @CurrentUser() caller: AuthenticatedUser,
    @Query() query: ListWeddingsQueryDto,
  ): Promise<ListWeddingsResponseDto> {
    try {
      const { items, total } = await this.weddingsService.listWeddings(
        caller,
        {
          search: query.search,
          status: query.status,
          sort: query.sort,
          limit: query.limit ?? 50,
          offset: query.offset ?? 0,
        },
      );

      const hasMore = total > (query.offset ?? 0) + items.length;

      return { items, total, hasMore: hasMore ? 'true' : 'false' };
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new BadRequestException({
          message: err.message,
          field: err.field,
        });
      }
      throw err;
    }
  }

  @Post()
  @Roles('WeddingPlanner')
  @HttpCode(201)
  async create(
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: CreateWeddingDto,
  ): Promise<WeddingDto> {
    try {
      return await this.weddingsService.createWedding(
        { actorId: caller.id, tenantId: caller.tenantId },
        dto,
      );
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new BadRequestException({
          message: err.message,
          field: err.field,
        });
      }
      throw err;
    }
  }

  // US-010: read a single wedding the caller owns (WP) or any in
  // their tenant (Admin). No @Roles — the service applies the
  // role-aware scope. NotFound is returned for every "not visible
  // from the caller's perspective" case — no enumeration.
  @Get(':id')
  async getOne(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<WeddingDto> {
    try {
      return await this.weddingsService.getWedding(caller, id);
    } catch (err) {
      if (err instanceof WeddingNotFoundError) {
        throw new NotFoundException('Wedding not found');
      }
      throw err;
    }
  }

  // US-010: update the five basic-detail fields. @Roles gates the
  // endpoint to a Wedding Planner session (an Administrator acting
  // as a WP is also allowed by the dual-role rule). Archived
  // weddings are refused with the same 404 the not-found case
  // returns — no enumeration.
  @Patch(':id')
  @Roles('WeddingPlanner')
  async update(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWeddingDto,
  ): Promise<WeddingDto> {
    try {
      return await this.weddingsService.updateWedding(
        { actorId: caller.id, tenantId: caller.tenantId },
        id,
        dto,
      );
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new BadRequestException({
          message: err.message,
          field: err.field,
        });
      }
      if (err instanceof WeddingNotFoundError) {
        throw new NotFoundException('Wedding not found');
      }
      throw err;
    }
  }

  // US-014a: replace the wedding's locations array. Full-array PUT —
  // adding / removing / reordering happens through the editor's
  // local state and the single PUT (Rule 15). Empty array is a
  // valid payload (Rule 23). The endpoint applies the same role-
  // aware scope `updateWedding` uses (tenant + owner for WP) and
  // refuses archived weddings with the same generalized envelope
  // every unauthorized / missing case surfaces.
  @Put(':id/locations')
  @Roles('WeddingPlanner')
  async putLocations(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PutWeddingLocationsDto,
  ): Promise<WeddingDto> {
    try {
      return await this.weddingsService.putLocations(
        { actorId: caller.id, tenantId: caller.tenantId },
        id,
        dto,
      );
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new BadRequestException({
          message: err.message,
          field: err.field,
        });
      }
      if (err instanceof WeddingNotFoundError) {
        throw new NotFoundException('Wedding not found');
      }
      throw err;
    }
  }
}
