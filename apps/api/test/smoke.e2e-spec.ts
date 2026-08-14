/**
 * E2E smoke tests — Wendy Planner API (Sprint 1 foundations)
 *
 * These tests run against the real NestJS application bootstrapped with
 * Test.createTestingModule(AppModule) and a live Postgres 17 instance
 * (docker-compose.yml, port 5433). No mocks — what passes here works in
 * production.
 *
 * Prerequisites:
 *   pnpm docker:up                              # Postgres 17 on :5433
 *   pnpm --filter @wendy/api prisma migrate deploy
 *
 * Run:
 *   pnpm --filter @wendy/api test:e2e
 *
 * Stories covered:
 *   ARC-003 — NestJS skeleton (boot, ValidationPipe)
 *   ARC-013 — JWT primitives (JWKS endpoint, token sign/verify)
 *   ARC-015 — Passport + RBAC guards (@Public opt-out, real token accepted)
 *   ARC-036 — Terminus health checks (live + ready with real DB)
 */

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { JwtService } from '../src/shared/jwt/jwt.service';

// All env vars (including JWT_PRIVATE_KEY_PEM) are set in test/setup.e2e.ts
// via Vitest setupFiles — they are present in process.env before this
// module is loaded and before Test.createTestingModule runs.
const TEST_KEY_ID = process.env.JWT_KEY_ID!;

describe('Wendy Planner API — E2E Sprint 1 (real Postgres 17)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    jwtService = moduleRef.get(JwtService);
  }, 30_000);

  afterAll(async () => {
    await app?.close();
  });

  // ── ARC-003 ──────────────────────────────────────────────────────────────

  describe('ARC-003 — bootstrap', () => {
    it('application boots and the app object is defined', () => {
      expect(app).toBeDefined();
    });

    it('returns 404 for an unknown route', async () => {
      await request(app.getHttpServer())
        .get('/does-not-exist')
        .expect(404);
    });
  });

  // ── ARC-036 /health/live ─────────────────────────────────────────────────

  describe('ARC-036 — GET /health/live', () => {
    it('responds 200 (public — no token needed)', async () => {
      await request(app.getHttpServer())
        .get('/health/live')
        .expect(200);
    });

    it('reports memory_heap and memory_rss as up', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/health/live')
        .expect(200);

      expect(body.status).toBe('ok');
      expect(body.info.memory_heap.status).toBe('up');
      expect(body.info.memory_rss.status).toBe('up');
    });
  });

  // ── ARC-036 /health/ready (real DB) ─────────────────────────────────────

  describe('ARC-036 — GET /health/ready', () => {
    it('responds 200 with all indicators up (Postgres 17 is running)', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(200);

      expect(body.status).toBe('ok');
      expect(body.info.database.status).toBe('up');
      expect(body.info.memory_heap.status).toBe('up');
      expect(body.info.memory_rss.status).toBe('up');
      expect(body.info.disk.status).toBe('up');
    });

    it('is a public endpoint — no token required', async () => {
      await request(app.getHttpServer())
        .get('/health/ready')
        .expect(200);
    });
  });

  // ── ARC-013 /.well-known/jwks.json ──────────────────────────────────────

  describe('ARC-013 — GET /.well-known/jwks.json', () => {
    it('responds 200 (public — no token needed)', async () => {
      await request(app.getHttpServer())
        .get('/.well-known/jwks.json')
        .expect(200);
    });

    it('returns a valid RFC 7517 JWKS document with the test kid', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/.well-known/jwks.json')
        .expect(200);

      expect(body.keys).toHaveLength(1);
      const key = body.keys[0];
      expect(key.kty).toBe('RSA');
      expect(key.kid).toBe(TEST_KEY_ID);
      expect(key.use).toBe('sig');
      expect(key.alg).toBe('RS256');
      expect(typeof key.n).toBe('string');
      expect(key.n.length).toBeGreaterThan(0);
      expect(key.e).toBe('AQAB');
    });

    it('sets Cache-Control: public, max-age=300', async () => {
      const res = await request(app.getHttpServer())
        .get('/.well-known/jwks.json')
        .expect(200);

      expect(res.headers['cache-control']).toBe('public, max-age=300');
    });
  });

  // ── ARC-013 JWT round-trip ───────────────────────────────────────────────

  describe('ARC-013 — JWT sign / verify round-trip', () => {
    it('signs an access token and verifies it via JwtService', () => {
      const token = jwtService.signAccessToken({
        sub: 'e2e-user' as never,
        role: 'WeddingPlanner',
        tenantId: 'e2e-tenant' as never,
      });

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const claims = jwtService.verifyAccessToken(token);
      expect(claims.sub).toBe('e2e-user');
      expect(claims.role).toBe('WeddingPlanner');
      expect(claims.tenantId).toBe('e2e-tenant');
    });

    it('signs a refresh token with aud=refresh', async () => {
      const { default: jwt } = await import('jsonwebtoken');
      const token = jwtService.signRefreshToken({
        sub: 'e2e-user' as never,
        role: 'WeddingPlanner',
        tenantId: 'e2e-tenant' as never,
      });

      const decoded = jwt.decode(token) as { aud: string };
      expect(decoded.aud).toBe('refresh');
    });

    it('rejects a token signed with HS256 (algorithm-confusion defense)', async () => {
      const { default: jwt } = await import('jsonwebtoken');
      const hsToken = jwt.sign(
        { sub: 'attacker', role: 'Administrator', tenantId: 'x' },
        'shared-secret',
        { algorithm: 'HS256', issuer: 'wendy-planner', audience: 'wendy', expiresIn: 900 },
      );
      expect(() => jwtService.verifyAccessToken(hsToken)).toThrow();
    });
  });

  // ── ARC-015 JwtAuthGuard ─────────────────────────────────────────────────

  describe('ARC-015 — JwtAuthGuard (@Public opt-out)', () => {
    it('/health/live is reachable without a token (@Public)', async () => {
      await request(app.getHttpServer())
        .get('/health/live')
        .expect(200);
    });

    it('/.well-known/jwks.json is reachable without a token (@Public)', async () => {
      await request(app.getHttpServer())
        .get('/.well-known/jwks.json')
        .expect(200);
    });

    it('a real access token is accepted on @Public routes (guard transparent)', async () => {
      const token = jwtService.signAccessToken({
        sub: 'e2e-user' as never,
        role: 'WeddingPlanner',
        tenantId: 'e2e-tenant' as never,
      });

      await request(app.getHttpServer())
        .get('/health/live')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
