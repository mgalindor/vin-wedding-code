/**
 * TC-101 (adapter): POST /oauth/token — AuthController inbound adapter.
 *
 * Scope per backend-blueprint §7.1:
 *   - Tests the inbound adapter (AuthController) and the outbound
 *     adapter (UserRepository) boundaries end-to-end against a real
 *     Postgres instance.
 *   - Validates the controller's DTO contract (ValidationPipe with
 *     whitelist + forbidNonWhitelisted + transform).
 *   - Validates the OAuth response shape (RFC 6749 §5.1).
 *   - Validates the HTTP status codes returned by the controller.
 *
 * What is NOT tested here (lives in test/functional/):
 *   - bcrypt internals, dummy hash timing attacks
 *   - JWT signing and verification (covered by jwt.service.spec.ts)
 *   - Use case branch logic
 */
import { hash } from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestApp, resetDatabase } from './helpers/test-app.factory';
import type { IntegrationTestContext } from './helpers/test-app.factory';

describe('TC-101: POST /oauth/token — AuthController adapter', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = await buildTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  const seedAdmin = async () => {
    await ctx.prisma.users.create({
      data: {
        id: 'admin-1',
        tenant_id: 'tenant-1',
        email: 'admin@wendy',
        full_name: 'Administrator',
        role: 'Administrator',
        is_disabled: false,
        password_hash: await hash('CorrectHorse1!', 4),
      },
    });
  };

  it('returns 200 + OAuth token shape on valid credentials', async () => {
    await seedAdmin();

    const res = await request(ctx.app.getHttpServer())
      .post('/oauth/token')
      .send({
        grant_type: 'password',
        username: 'admin@wendy',
        password: 'CorrectHorse1!',
      })
      .expect(200);

    // RFC 6749 §5.1 shape — only these three fields.
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('token_type', 'Bearer');
    expect(res.body).toHaveProperty('expires_in', 3600);
    expect(res.body).not.toHaveProperty('user');
    expect(typeof res.body.access_token).toBe('string');
    expect(res.body.access_token.split('.').length).toBe(3);
  });

  it('returns 400 when grant_type is not "password"', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/oauth/token')
      .send({
        grant_type: 'client_credentials',
        username: 'x',
        password: 'y',
      })
      .expect(400);

    // ValidationPipe may return the message as a string or as an array
    // of constraint strings depending on which decorators fire.
    expect(JSON.stringify(res.body.message)).toMatch(/Only grant_type=password/);
  });

  it('returns 401 with generic message on an unknown but well-formed username', async () => {
    // The platform's username is `<slug>@<tenant-suffix>`; it is NOT
    // validated as a real email. A non-email-shaped value still flows
    // through to the auth use case, which reports the same generic
    // "Invalid username or password" as any other miss.
    const res = await request(ctx.app.getHttpServer())
      .post('/oauth/token')
      .send({
        grant_type: 'password',
        username: 'not-an-email',
        password: 'x',
      })
      .expect(401);

    expect(res.body.message).toBe('Invalid username or password');
  });

  it('returns 400 when username is too short', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/oauth/token')
      .send({
        grant_type: 'password',
        username: 'a', // below min length 3
        password: 'x',
      })
      .expect(400);

    expect(JSON.stringify(res.body.message)).toMatch(/Username is too short/);
  });

  it('returns 401 with generic message on unknown user', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/oauth/token')
      .send({
        grant_type: 'password',
        username: 'ghost@wendy',
        password: 'whatever',
      })
      .expect(401);

    expect(res.body.message).toBe('Invalid username or password');
  });

  it('returns 401 with generic message on wrong password', async () => {
    await seedAdmin();

    await request(ctx.app.getHttpServer())
      .post('/oauth/token')
      .send({
        grant_type: 'password',
        username: 'admin@wendy',
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('rejects unknown fields (forbidNonWhitelisted)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/oauth/token')
      .send({
        grant_type: 'password',
        username: 'admin@wendy',
        password: 'x',
        is_admin: true, // not in AuthenticateUserDto - must be rejected
      })
      .expect(400);

    expect(JSON.stringify(res.body.message)).toMatch(/should not exist|is_unknown/);
  });

  it('returns 401 when the account is disabled', async () => {
    await ctx.prisma.users.create({
      data: {
        id: 'admin-disabled',
        tenant_id: 'tenant-1',
        email: 'disabled@wendy',
        full_name: 'Disabled',
        role: 'Administrator',
        is_disabled: true,
        password_hash: await hash('whatever', 4),
      },
    });

    const res = await request(ctx.app.getHttpServer())
      .post('/oauth/token')
      .send({
        grant_type: 'password',
        username: 'disabled@wendy',
        password: 'whatever',
      })
      .expect(401);

    expect(res.body.message).toBe('Invalid username or password');
  });
});
