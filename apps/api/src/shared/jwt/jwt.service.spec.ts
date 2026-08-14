import { generateKeyPairSync } from 'node:crypto';

import * as jwtLib from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { JwtConfig } from '../../config/jwt.config';

import { JwtService } from './jwt.service';

// ─── helpers ──────────────────────────────────────────────────────────────

function generateRsaPrivateKeyPem(): string {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return privateKey;
}

function makeConfig(overrides: Partial<JwtConfig> = {}): JwtConfig {
  const cfg = new JwtConfig();
  cfg.JWT_PRIVATE_KEY_PEM = generateRsaPrivateKeyPem();
  cfg.JWT_KEY_ID = '00000000-0000-4000-8000-000000000000';
  cfg.JWT_ISSUER = 'wendy-planner';
  cfg.JWT_AUDIENCE = 'wendy';
  cfg.JWT_ACCESS_TOKEN_TTL_SECONDS = 900;
  cfg.JWT_REFRESH_TOKEN_TTL_SECONDS = 604800;
  return Object.assign(cfg, overrides);
}

// ─── JwtService unit tests ─────────────────────────────────────────────────

describe('JwtService', () => {
  // ── constructor ──────────────────────────────────────────────────────────

  it('throws a clean error if the private key PEM is malformed', () => {
    const cfg = makeConfig({ JWT_PRIVATE_KEY_PEM: 'not-a-real-key' });
    expect(() => new JwtService(cfg)).toThrow(/Invalid JWT private key/);
  });

  // ── signAccessToken / verifyAccessToken round-trip ── Rule 1, 3, 6 ──────

  it('signs an access token and verifies it (Rule 1, 3, 6 — spec §UX Notes line 116)', () => {
    const svc = new JwtService(makeConfig());
    const token = svc.signAccessToken({
      sub: 'user-1' as never,
      role: 'WeddingPlanner',
      tenantId: 'tenant-1' as never,
    });

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // header.payload.signature

    const claims = svc.verifyAccessToken(token);
    expect(claims.sub).toBe('user-1');
    expect(claims.role).toBe('WeddingPlanner');
    expect(claims.tenantId).toBe('tenant-1');
  });

  it('access token header carries kid and alg=RS256', () => {
    const cfg = makeConfig();
    const svc = new JwtService(cfg);
    const token = svc.signAccessToken({
      sub: 'u' as never,
      role: 'Administrator',
      tenantId: 't' as never,
    });
    const [headerB64] = token.split('.');
    if (!headerB64) throw new Error('malformed token');
    const header = JSON.parse(
      Buffer.from(headerB64, 'base64url').toString(),
    ) as { alg: string; kid: string };
    expect(header.alg).toBe('RS256');
    expect(header.kid).toBe(cfg.JWT_KEY_ID);
  });

  it('access token expires in ~15 minutes (900s TTL)', () => {
    const cfg = makeConfig({ JWT_ACCESS_TOKEN_TTL_SECONDS: 900 });
    const svc = new JwtService(cfg);
    const nowSec = Math.floor(Date.now() / 1000);
    const token = svc.signAccessToken({
      sub: 'u' as never,
      role: 'WeddingPlanner',
      tenantId: 't' as never,
    });
    const decoded = jwtLib.decode(token) as { exp: number; iat: number };
    expect(decoded.exp - decoded.iat).toBe(900);
    // exp should be within ~5s of now + 900
    expect(decoded.exp).toBeGreaterThanOrEqual(nowSec + 895);
    expect(decoded.exp).toBeLessThanOrEqual(nowSec + 910);
  });

  // ── signRefreshToken ── Rule 4 ────────────────────────────────────────

  it('refresh token carries aud=refresh and expires in 7 days (604800s)', () => {
    const svc = new JwtService(makeConfig());
    const nowSec = Math.floor(Date.now() / 1000);
    const token = svc.signRefreshToken({
      sub: 'u' as never,
      role: 'WeddingPlanner',
      tenantId: 't' as never,
    });
    const decoded = jwtLib.decode(token) as {
      aud: string;
      exp: number;
      iat: number;
      type: string;
    };
    expect(decoded.aud).toBe('refresh');
    expect(decoded.type).toBe('refresh');
    expect(decoded.exp - decoded.iat).toBe(604800);
    expect(decoded.exp).toBeGreaterThanOrEqual(nowSec + 604795);
  });

  // ── verifyAccessToken failures — Rule 6, UX Notes lines 117 ──────────

  it('rejects a token with the wrong audience (Rule 6 — spec §UX Notes line 117)', () => {
    const cfg = makeConfig();
    const svc = new JwtService(cfg);
    const wrongAudToken = jwtLib.sign(
      { sub: 'u', role: 'WeddingPlanner', tenantId: 't' },
      cfg.JWT_PRIVATE_KEY_PEM,
      {
        algorithm: 'RS256',
        issuer: cfg.JWT_ISSUER,
        audience: 'wrong-audience',
        expiresIn: 900,
      },
    );
    expect(() => svc.verifyAccessToken(wrongAudToken)).toThrow();
  });

  it('rejects a token with the wrong issuer (Rule 6 — spec §UX Notes line 117)', () => {
    const cfg = makeConfig();
    const svc = new JwtService(cfg);
    const wrongIssToken = jwtLib.sign(
      { sub: 'u', role: 'WeddingPlanner', tenantId: 't' },
      cfg.JWT_PRIVATE_KEY_PEM,
      {
        algorithm: 'RS256',
        issuer: 'evil-issuer',
        audience: cfg.JWT_AUDIENCE,
        expiresIn: 900,
      },
    );
    expect(() => svc.verifyAccessToken(wrongIssToken)).toThrow();
  });

  it('rejects a token signed with HS256 — algorithm confusion defense (Rule 6, tech-spec §Risks)', () => {
    const cfg = makeConfig();
    const svc = new JwtService(cfg);
    const hs256Token = jwtLib.sign(
      { sub: 'u', role: 'Administrator', tenantId: 't' },
      'shared-secret',
      { algorithm: 'HS256', issuer: cfg.JWT_ISSUER, audience: cfg.JWT_AUDIENCE, expiresIn: 900 },
    );
    expect(() => svc.verifyAccessToken(hs256Token)).toThrow();
  });

  it('rejects an expired token', () => {
    const cfg = makeConfig({ JWT_ACCESS_TOKEN_TTL_SECONDS: 1 });
    const svc = new JwtService(cfg);
    // Sign with exp in the past
    const expiredToken = jwtLib.sign(
      { sub: 'u', role: 'WeddingPlanner', tenantId: 't' },
      cfg.JWT_PRIVATE_KEY_PEM,
      {
        algorithm: 'RS256',
        issuer: cfg.JWT_ISSUER,
        audience: cfg.JWT_AUDIENCE,
        expiresIn: -1,
      },
    );
    expect(() => svc.verifyAccessToken(expiredToken)).toThrow();
  });

  // ── getJwks — Rule 2 ──────────────────────────────────────────────────

  it('returns a JWKS document with kid, kty=RSA, use=sig, alg=RS256 (Rule 2)', () => {
    const cfg = makeConfig();
    const svc = new JwtService(cfg);
    const jwks = svc.getJwks();

    expect(jwks.keys.length).toBe(1);
    const key = jwks.keys[0];
    expect(key).toBeDefined();
    if (!key) return;

    expect(key.kty).toBe('RSA');
    expect(key.kid).toBe(cfg.JWT_KEY_ID);
    expect(key.use).toBe('sig');
    expect(key.alg).toBe('RS256');
    expect(typeof key.n).toBe('string');
    expect(key.n.length).toBeGreaterThan(0);
    expect(key.e).toBe('AQAB');
  });
});
