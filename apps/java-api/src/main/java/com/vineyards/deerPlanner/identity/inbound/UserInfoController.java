package com.vineyards.deerPlanner.identity.inbound;

import com.vineyards.deerPlanner.identity.facade.IdentityInPort;
import com.vineyards.deerPlanner.identity.facade.UserProfileResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/oauth")
@PrimaryAdapter
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
public class UserInfoController {

  private final IdentityInPort identityApi;

  @GetMapping("/userinfo")
  public ResponseEntity<UserProfileResponse> userinfo(@AuthenticationPrincipal Jwt jwt) {
    String userId = jwt.getSubject();
    UserProfileResponse profile = identityApi.getProfile(userId);
    return ResponseEntity.ok(profile);
  }
}
