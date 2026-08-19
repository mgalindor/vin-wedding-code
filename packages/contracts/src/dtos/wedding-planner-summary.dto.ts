import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import type { UserId } from '../ids.js';
import { UserRole } from './auth.dtos.js';

export class WeddingPlannerSummaryDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,64}$/, {
    message: 'id must be a 6-64 char NanoId',
  })
  id!: UserId;

  @IsString()
  @MaxLength(120)
  fullName!: string;

  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(254)
  email!: string;

  @IsEnum(UserRole, { message: 'role must be Administrator or WeddingPlanner' })
  role!: UserRole;

  @IsBoolean()
  isDisabled!: boolean;

  @IsString()
  createdAt!: string;
}