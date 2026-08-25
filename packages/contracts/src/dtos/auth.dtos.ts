import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
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
// DB lookup. The platform's username is a simple string of the form
// `<slug>@<tenant-suffix>`; it is NOT a real internet email (the
// suffix is the org identifier, not an FQDN), so we deliberately do
// not apply email-format validation here — only min/max length and
// presence of an `@` separator.
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
  @MinLength(3, { message: 'Username is too short' })
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
 *
 *  The refresh token is delivered in two places — both are valid for
 *  the client:
 *    1. As an `HttpOnly` cookie (`__wendy_rt__`) so the browser sends
 *       it automatically on `POST /oauth/refresh`. The FE never reads
 *       this cookie from JS.
 *    2. As `refresh_token` in this response body so non-browser
 *       clients (CLI, integration tests, future mobile) can use the
 *       refresh flow without a cookie jar.
 *  Production clients should prefer the cookie (it is HttpOnly, so JS
 *  cannot exfiltrate it). The body value exists for parity with
 *  RFC 6749 §5.1 and for headless consumers.
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

  /** Opaque refresh token (3-day TTL). Also stamped as an HttpOnly cookie. */
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;

  /** Refresh-token lifetime in seconds (3 days = 259200). */
  @IsInt()
  @Min(1)
  refresh_expires_in!: number;
}

/**
 * Request body for `POST /oauth/refresh`.
 *
 * The FE normally uses the HttpOnly cookie (sent automatically by the
 * browser on the `/oauth` path). A non-browser client can pass the
 * refresh token in the body instead. The two are equivalent — the
 * service honours whichever is present and prefers the cookie.
 *
 * Both fields are optional at the DTO level because the cookie path
 * requires no body at all. The controller enforces the "at least
 * one source" rule in code.
 */
export class RefreshTokenDto {
  @IsOptional()
  @IsString({ message: 'refresh_token must be a string' })
  @IsNotEmpty({ message: 'refresh_token cannot be empty' })
  refresh_token?: string;
}

/**
 * Response shape for `POST /oauth/refresh` — mirrors
 * {@link AuthenticateUserResponseDto} but the body is the authoritative
 * source for non-browser clients (the cookie is set as a side effect).
 */
export class RefreshTokenResponseDto {
  @IsString()
  @IsNotEmpty()
  access_token!: string;

  @IsEnum(['Bearer'], { message: 'token_type must be Bearer' })
  token_type!: 'Bearer';

  @IsInt()
  @Min(1)
  expires_in!: number;

  /** Rotated refresh token (a new value is issued on every refresh). */
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;

  @IsInt()
  @Min(1)
  refresh_expires_in!: number;
}

export type UserRoleType = keyof typeof UserRole;
