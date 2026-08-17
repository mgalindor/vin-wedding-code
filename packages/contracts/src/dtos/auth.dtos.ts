import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { UserId, TenantId } from '../ids.js';

export enum UserRole {
  Administrator = 'Administrator',
  WeddingPlanner = 'WeddingPlanner',
}

// Password grant only; refresh tokens are out of scope for MVP.
export class AuthenticateUserDto {
  @IsEnum(['password'], {
    message: 'Only grant_type=password is supported',
  })
  grant_type!: 'password';

  @IsString({ message: 'Username is required' })
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(1)
  @MaxLength(64)
  username!: string;

  @IsString({ message: 'Password is required' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(1)
  @MaxLength(256)
  password!: string;
}

/** Profile embedded in the JWT payload and returned on login. */
export class UserProfileDto {
  @IsString()
  id!: UserId;

  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  tenantId!: TenantId;
}

/** Access token lives for 7 days; no refresh tokens in MVP. */
export class AuthenticateUserResponseDto {
  @IsString()
  access_token!: string;

  @IsEnum(['Bearer'])
  token_type!: 'Bearer';

  /** Token lifetime in seconds (7 days = 604800). */
  @IsNotEmpty()
  expires_in!: number;

  user!: UserProfileDto;
}

export type UserRoleType = keyof typeof UserRole;
