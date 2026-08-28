package com.vineyards.deerPlanner.shared.security;

import com.nimbusds.jwt.JWTClaimsSet;
import org.jmolecules.architecture.hexagonal.PrimaryPort;
import org.springframework.modulith.NamedInterface;

@PrimaryPort
@NamedInterface
public interface JwtAuthenticator {

    JWTClaimsSet verifyAccessToken(String token);

    String getJwksJson();
}
