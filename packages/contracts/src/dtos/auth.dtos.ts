import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

import type { UserId, TenantId } from '../ids.js';

export enum UserRole {
  Administrator = 'Administrator',
  WeddingPlanner = 'WeddingPlanner',
}

// Password grant only; refresh tokens are out of scope for MVP.
// Username is normalised server-side (trim + lowercase) before any
// DB lookup, and validated as a real email so the FE can't bypass
// the per-tenant format check.
export class AuthenticateUserDto {
  @IsEnum(['password'], {
    message: 'Only grant_type=password is supported',
  })
  grant_type!: 'password';

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  @IsEmail(
    {},
    { message: 'Username must be a valid email address' },
  )
  @MaxLength(254, { message: 'Username is too long' })
  username!: string;

  // No length upper bound enforced at the class level; bcrypt will
  // silently truncate > 72 bytes. We rely on the byte limit being
  // documented for sign-up flows elsewhere.
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(1, { message: 'Password is required' })
  @MaxLength(256, { message: 'Password is too long' })
  password!: string;
}

/** Profile returned alongside the access token at login time. */
export class UserProfileDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,64}$/, {
    message: 'id must be a 6-64 char NanoId',
  })
  id!: UserId;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(254)
  email!: string;

  @IsEnum(UserRole, { message: 'role must be Administrator or WeddingPlanner' })
  role!: UserRole;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,64}$/, {
    message: 'tenantId must be a 6-64 char NanoId',
  })
  tenantId!: TenantId;
}

/** Access token lives for 1 hour (3600s); refresh lives for 3 days (259200s).
 *  No revocation in MVP — see tech-spec.md §Token Lifecycle.
 *
 *  Response shape follows the OAuth 2.0 token endpoint contract (RFC 6749
 *  §5.1). The user's fullName, email, role and tenantId are encoded as
 *  JWT claims — decode the access_token on the client to hydrate the
 *  profile, no separate /me call needed.
 */
export class AuthenticateUserResponseDto {
  @IsString()
  @IsNotEmpty()
  access_token!: string;

  @IsEnum(['Bearer'], { message: 'token_type must be Bearer' })
  token_type!: 'Bearer';

  /** Token lifetime in seconds (1 hour = 3600). */
  @IsInt()
  @Min(1)
  expires_in!: number;
}

export type UserRoleType = keyof typeof UserRole;
