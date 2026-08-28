package com.vineyards.deerPlanner.shared.security;

import org.jmolecules.architecture.hexagonal.SecondaryPort;
import org.springframework.modulith.NamedInterface;

@SecondaryPort
@NamedInterface
public interface JwtIssuerPort {

    String issueAccessToken(String userId, String username, String displayName, String email, String role);

    String issueRefreshToken(String userId, String username, String role);

    long accessTokenTtlSeconds();

    long refreshTokenTtlSeconds();
}
