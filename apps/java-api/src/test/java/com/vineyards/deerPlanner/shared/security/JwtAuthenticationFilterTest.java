package com.vineyards.deerPlanner.shared.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.JWTClaimsSet.Builder;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

class JwtAuthenticationFilterTest {

  private static JWTClaimsSet claimsWithRoles(Object rolesClaim) {
    Date now = new Date();
    Builder builder =
        new JWTClaimsSet.Builder()
            .subject("user-1")
            .issuer("deer-planner")
            .audience("deer-planner-api")
            .issueTime(now)
            .notBeforeTime(now)
            .expirationTime(new Date(now.getTime() + 60_000L))
            .jwtID("test")
            .claim("username", "alice")
            .claim("displayName", "Alice")
            .claim("email", "alice@example.com");
    if (rolesClaim != null) {
      builder.claim(JwtService.ROLES_CLAIM, rolesClaim);
    }
    return builder.build();
  }

  @Test
  void toAuthorities_whenRolesClaimIsList_buildsOneAuthorityPerRole() throws Exception {
    JWTClaimsSet claims = claimsWithRoles(List.of("Administrator", "EventOrganizer"));

    var authorities = JwtAuthenticationFilter.toAuthorities(claims);

    assertThat(authorities)
        .extracting(GrantedAuthority::getAuthority)
        .containsExactlyInAnyOrder("ROLE_Administrator", "ROLE_EventOrganizer");
  }

  @Test
  void toAuthorities_whenRolesClaimIsMissing_returnsEmptyAuthorities() throws Exception {
    JWTClaimsSet claims = claimsWithRoles(null);

    var authorities = JwtAuthenticationFilter.toAuthorities(claims);

    assertThat(authorities).isEmpty();
  }

  @Test
  void toAuthorities_whenRolesClaimIsSingleString_treatsItAsOneRole() throws Exception {
    JWTClaimsSet claims = claimsWithRoles("EventOrganizer");

    var authorities = JwtAuthenticationFilter.toAuthorities(claims);

    assertThat(authorities)
        .extracting(GrantedAuthority::getAuthority)
        .containsExactly("ROLE_EventOrganizer");
  }
}
