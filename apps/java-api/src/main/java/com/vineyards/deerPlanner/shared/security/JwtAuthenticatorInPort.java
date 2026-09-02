package com.vineyards.deerPlanner.shared.security;

import com.nimbusds.jwt.JWTClaimsSet;
import org.jmolecules.architecture.hexagonal.PrimaryPort;
import org.springframework.modulith.NamedInterface;

@PrimaryPort
@NamedInterface
public interface JwtAuthenticatorInPort {

  JWTClaimsSet verifyAccessToken(String token);

  /**
   * Verifies a refresh token: signature + expiry + audience must be {@code refresh}. Throws {@link
   * JwtService.JwtVerificationException} on any failure.
   */
  JWTClaimsSet verifyRefreshToken(String token);

  String getJwksJson();
}
