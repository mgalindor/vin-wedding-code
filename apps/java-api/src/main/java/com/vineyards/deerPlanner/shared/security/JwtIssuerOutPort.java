package com.vineyards.deerPlanner.shared.security;

import java.util.Set;
import org.jmolecules.architecture.hexagonal.SecondaryPort;
import org.springframework.modulith.NamedInterface;

@SecondaryPort
@NamedInterface
public interface JwtIssuerOutPort {

  String issueAccessToken(
      String userId, String username, String displayName, String email, Set<String> roles);

  String issueRefreshToken(String userId, String username, Set<String> roles);

  long accessTokenTtlSeconds();

  long refreshTokenTtlSeconds();
}
