import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Logger,
  NotFoundException,
  Post,
} from '@nestjs/common';
import {
  OnboardWeddingPlannerDto,
  OnboardWeddingPlannerResponseDto,
} from '@wendy/contracts';

import { Roles } from '../../../shared/decorators/auth.decorators';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../shared/decorators/current-user.decorator';
import {
  ConflictError,
  IdentityService,
  TenantNotFoundError,
  ValidationError,
} from '../application/identity.service';

@Controller('api/v1/wedding-planners')
export class WeddingPlannersController {
  private readonly logger = new Logger(WeddingPlannersController.name);

  constructor(private readonly identityService: IdentityService) {}

  @Post()
  @Roles('Administrator')
  @HttpCode(201)
  async onboard(
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: OnboardWeddingPlannerDto,
  ): Promise<OnboardWeddingPlannerResponseDto> {
    try {
      return await this.identityService.onboardWeddingPlanner(
        { actorId: caller.id, tenantId: caller.tenantId },
        {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          username: dto.username,
          password: dto.password,
          phone: dto.phone,
        },
      );
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new BadRequestException({
          message: err.message,
          field: err.field,
        });
      }
      if (err instanceof ConflictError) {
        throw new ConflictException({
          message: err.message,
          field: err.field,
        });
      }
      if (err instanceof TenantNotFoundError) {
        throw new NotFoundException('Tenant not found');
      }
      throw err;
    }
  }
}