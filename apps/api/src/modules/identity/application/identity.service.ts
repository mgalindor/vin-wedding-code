import { randomBytes } from 'node:crypto';

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { newId } from '@wendy/contracts';
import type {
  OnboardWeddingPlannerResponseDto,
  UserProfileDto,
  UserRole,
} from '@wendy/contracts';
import { compare, hash } from 'bcrypt';

import type { TenantId, UserId } from '../../../shared/jwt/jwt.service';
import { AdminPrincipal } from '../domain/admin-principal';
import { UserRepository } from '../outbound-adapters/user.repository';

import {
  TENANT_EMAIL_SUFFIX_PROVIDER,
  type TenantEmailSuffixProvider,
} from './ports/tenant-email-suffix.provider';

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 25;

const BCRYPT_COST = 12;
const EMAIL_LIKE_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_PATTERN = /^[a-z0-9]+$/;

// Runtime-generated bcrypt hash to keep `authenticate` constant-time
// against user-enumeration timing attacks. Generated from random bytes
// (never a literal) so it cannot leak via source control or scanners.
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hash(randomBytes(24).toString('base64'), BCRYPT_COST);
  }
  return dummyHashPromise;
}

export interface OnboardWeddingPlannerInput {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
}

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly userRepository: UserRepository,
    @Inject(TENANT_EMAIL_SUFFIX_PROVIDER)
    private readonly tenantEmailSuffixProvider: TenantEmailSuffixProvider,
  ) {}

  async authenticate(rawEmail: string, password: string) {
    const email = (rawEmail ?? '').trim().toLowerCase();

    const user = await this.userRepository.findUserForAuth(email);
    const dummyHash = await getDummyHash();
    const passwordToCompare = user?.password_hash ?? dummyHash;
    const passwordOk = await compare(password, passwordToCompare);

    if (!user || !passwordOk || user.is_disabled) {
      return null;
    }
    return user;
  }

  async findProfile(userId: UserId): Promise<UserProfileDto> {
    const profile = await this.userRepository.findProfileById(userId);
    if (!profile || profile.is_disabled) {
      throw new NotFoundException('User not found');
    }
    return {
      id: profile.id as UserId,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role as UserRole,
      tenantId: profile.tenant_id as TenantId,
    };
  }

  async onboardWeddingPlanner(
    principal: AdminPrincipal,
    input: OnboardWeddingPlannerInput,
  ): Promise<OnboardWeddingPlannerResponseDto> {
    const firstName = (input.firstName ?? '').trim();
    const lastName = (input.lastName ?? '').trim();
    const email = (input.email ?? '').trim().toLowerCase();
    const slug = (input.username ?? '').trim();
    const password = input.password ?? '';
    const phone = input.phone?.trim() || null;

    if (!firstName) throw new ValidationError('firstName is required', 'firstName');
    if (!lastName) throw new ValidationError('lastName is required', 'lastName');
    if (!email) throw new ValidationError('email is required', 'email');
    if (!slug) throw new ValidationError('username is required', 'username');
    if (!password) throw new ValidationError('password is required', 'password');

    if (!SLUG_PATTERN.test(slug)) {
      throw new ValidationError(
        'username must contain lowercase letters and digits only',
        'username',
      );
    }
    if (!EMAIL_LIKE_PATTERN.test(email)) {
      throw new ValidationError(
        'email must be a valid email address',
        'email',
      );
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new ValidationError(
        `password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        'password',
      );
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
      throw new ValidationError(
        `password must be at most ${PASSWORD_MAX_LENGTH} characters`,
        'password',
      );
    }

    const suffix = await this.tenantEmailSuffixProvider.findSuffixByTenantId(
      principal.tenantId,
    );
    if (!suffix) {
      throw new TenantNotFoundError(principal.tenantId);
    }

    const fullUsername = `${slug}@${suffix}`;

    const adminProfile = await this.userRepository.findProfileById(
      principal.actorId,
    );
    if (adminProfile) {
      const adminEmailLocal = adminProfile.email.split('@')[0];
      if (adminEmailLocal === slug) {
        throw new ConflictError('username is already in use', 'username');
      }
      if (adminProfile.email === email) {
        throw new ConflictError('email is already in use', 'email');
      }
    }

    const emailClash = await this.userRepository.findIdByEmail(email);
    if (emailClash) {
      throw new ConflictError('email is already in use', 'email');
    }
    const usernameClash = await this.userRepository.findIdByEmail(fullUsername);
    if (usernameClash) {
      throw new ConflictError('username is already in use', 'username');
    }

    const newUserId = newId<UserId>();
    const passwordHash = await hash(password, BCRYPT_COST);

    await this.userRepository.createWeddingPlanner({
      id: newUserId,
      tenantId: principal.tenantId,
      email: fullUsername,
      fullName: `${firstName} ${lastName}`.trim(),
      phone,
      passwordHash,
      onboardedByAdminId: principal.actorId,
    });

    this.logger.log({
      event: 'user.created',
      userId: newUserId,
      tenantId: principal.tenantId,
      role: 'WeddingPlanner',
      actorId: principal.actorId,
      timestamp: new Date().toISOString(),
    });

    return {
      id: newUserId,
      username: fullUsername,
      initialPassword: password,
      createdAt: new Date().toISOString(),
      onboardedByAdminId: principal.actorId,
    };
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends Error {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class TenantNotFoundError extends Error {
  constructor(public readonly tenantId: string) {
    super(`Tenant "${tenantId}" not found`);
    this.name = 'TenantNotFoundError';
  }
}