import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import type { UserId } from '../ids.js';

export class OnboardWeddingPlannerDto {
  @IsString({ message: 'firstName must be a string' })
  @IsNotEmpty({ message: 'firstName is required' })
  @MaxLength(120, { message: 'firstName is too long' })
  firstName!: string;

  @IsString({ message: 'lastName must be a string' })
  @IsNotEmpty({ message: 'lastName is required' })
  @MaxLength(120, { message: 'lastName is too long' })
  lastName!: string;

  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(254, { message: 'email is too long' })
  email!: string;

  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username is required' })
  @Matches(/^[a-z0-9]+$/, {
    message:
      'username must contain lowercase letters and digits only (no @, no spaces)',
  })
  @MaxLength(64, { message: 'username is too long' })
  username!: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(10, { message: 'password must be at least 10 characters' })
  @MaxLength(25, { message: 'password must be at most 25 characters' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'phone must be a string' })
  @MaxLength(50, { message: 'phone is too long' })
  phone?: string;
}

export class OnboardWeddingPlannerResponseDto {
  id!: UserId;
  username!: string;
  initialPassword!: string;
  createdAt!: string;
  onboardedByAdminId!: UserId;
}