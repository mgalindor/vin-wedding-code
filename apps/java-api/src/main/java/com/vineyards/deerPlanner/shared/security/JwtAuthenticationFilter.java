package com.vineyards.deerPlanner.shared.security;

import com.nimbusds.jwt.JWTClaimsSet;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.ParseException;
import java.util.Collection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@PrimaryAdapter
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final String BEARER_PREFIX = "Bearer ";

  private final JwtAuthenticatorInPort jwtAuthenticator;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {

    String token = extractBearerToken(request);
    if (token == null) {
      chain.doFilter(request, response);
      return;
    }

    try {
      JWTClaimsSet claims = jwtAuthenticator.verifyAccessToken(token);
      AbstractAuthenticationToken authentication = toAuthentication(claims);
      SecurityContextHolder.getContext().setAuthentication(authentication);
    } catch (JwtService.JwtVerificationException | ParseException ex) {
      log.debug("Rejecting bearer token: {}", ex.getMessage());
      SecurityContextHolder.clearContext();
    }

    chain.doFilter(request, response);
  }

  private static String extractBearerToken(HttpServletRequest request) {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith(BEARER_PREFIX)) {
      return header.substring(BEARER_PREFIX.length()).trim();
    }
    return null;
  }

  private static AbstractAuthenticationToken toAuthentication(JWTClaimsSet claims)
      throws ParseException {
    Collection<GrantedAuthority> authorities =
        List.of(new SimpleGrantedAuthority("ROLE_" + claims.getStringClaim("role")));

    Jwt jwt =
        Jwt.withTokenValue("resolved-by-jwt-service")
            .header("alg", "RS256")
            .header("kid", "n/a")
            .subject(claims.getSubject())
            .issuer(claims.getIssuer())
            .audience(List.copyOf(claims.getAudience()))
            .issuedAt(claims.getIssueTime().toInstant())
            .expiresAt(claims.getExpirationTime().toInstant())
            .claim("username", claims.getStringClaim("username"))
            .claim("role", claims.getStringClaim("role"))
            .claim("displayName", claims.getStringClaim("displayName"))
            .claim("email", claims.getStringClaim("email"))
            .build();

    return new JwtAuthenticationToken(jwt, authorities, claims.getSubject());
  }
}
