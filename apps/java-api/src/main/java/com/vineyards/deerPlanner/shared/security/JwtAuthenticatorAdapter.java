package com.vineyards.deerPlanner.shared.security;

import com.nimbusds.jwt.JWTClaimsSet;
import lombok.RequiredArgsConstructor;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.stereotype.Component;

@Component
@PrimaryAdapter
@RequiredArgsConstructor
public class JwtAuthenticatorAdapter implements JwtAuthenticator {

  private final JwtService jwtService;

  @Override
  public JWTClaimsSet verifyAccessToken(String token) {
    return jwtService.verifyAccessToken(token);
  }

  @Override
  public String getJwksJson() {
    return jwtService.getJwksJson();
  }
}
