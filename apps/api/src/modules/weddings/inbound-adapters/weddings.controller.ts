import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
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
  WeddingDto,
} from '@wendy/contracts';

import { Roles } from '../../../shared/decorators/auth.decorators';
import { CurrentUser, type AuthenticatedUser } from '../../../shared/decorators/current-user.decorator';
import { ValidationError, WeddingsService } from '../application/weddings.service';

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
}
