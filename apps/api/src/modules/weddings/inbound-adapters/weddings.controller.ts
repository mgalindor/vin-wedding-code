import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
} from '@nestjs/common';
// `import` (NOT `import type`) — the @Body() parameter type is consumed
// by TypeScript's `design:paramtypes` metadata that NestJS uses at
// runtime to instantiate the ValidationPipe target class. A
// type-only import is erased by the compiler, the metadata falls
// back to `Function`, and the global `forbidNonWhitelisted: true`
// pipe then rejects every incoming field as "should not exist".
// This mirrors the existing `wedding-planners.controller.ts` pattern.
import { CreateWeddingDto, WeddingDto } from '@wendy/contracts';

import { Roles } from '../../../shared/decorators/auth.decorators';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../shared/decorators/current-user.decorator';
import { ValidationError, WeddingsService } from '../application/weddings.service';

/**
 * Wedding bounded context — HTTP surface (US-009).
 *
 * Path prefix `/api/v1/weddings` is stable across the bounded context;
 * subsequent stories (US-010/011/012/013/022) extend this controller
 * with read, update, archive, and publish endpoints at the same
 * prefix. The path does NOT change in those stories.
 *
 * Authorization: `@Roles(WeddingPlanner)` — every authenticated
 * Wedding Planner may call this endpoint. Per Rule 1 of the
 * functional spec, a pure Administrator is refused with the existing
 * generalized envelope; per ARC-011, an Administrator who also acts
 * as a Wedding Planner may call it via the Wedding Planner session.
 */
@Controller('api/v1/weddings')
export class WeddingsController {
  private readonly logger = new Logger(WeddingsController.name);

  constructor(private readonly weddingsService: WeddingsService) {}

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