import { Controller, Get, Header } from '@nestjs/common';

import { Public } from '../../../shared/decorators/auth.decorators';
import { JwtService } from '../../../shared/jwt/jwt.service';

/**
 * Public key discovery endpoint (Rule 2 of the functional spec,
 * ADR-05 §Standards-aligned URLs). Returns the RFC 7517 JWKS document
 * for our RS256 signing key.
 *
 * Anyone may fetch this — the private key never leaves the process.
 * Response is cached downstream (5 min) so clients don't hammer the
 * API; rotation is handled by adding new entries with a new `kid`.
 */
@Controller('.well-known')
export class JwksController {
  constructor(private readonly jwtService: JwtService) {}

  @Public()
  @Get('jwks.json')
  @Header('Cache-Control', 'public, max-age=300')
  getJwks() {
    return this.jwtService.getJwks();
  }
}
