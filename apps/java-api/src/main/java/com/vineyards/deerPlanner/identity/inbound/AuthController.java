package com.vineyards.deerPlanner.identity.inbound;

import com.vineyards.deerPlanner.identity.facade.AuthenticateResponse;
import com.vineyards.deerPlanner.identity.facade.IdentityInPort;
import com.vineyards.deerPlanner.identity.facade.dto.ChangePasswordRequest;
import com.vineyards.deerPlanner.identity.facade.dto.RefreshTokenRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/oauth")
@PrimaryAdapter
@RequiredArgsConstructor
@Slf4j
public class AuthController {

  private final IdentityInPort identityApi;

  @PostMapping(path = "/token")
  public ResponseEntity<AuthenticateResponse> token(@Valid @RequestBody TokenBody body) {
    AuthenticateResponse response = identityApi.authenticate(body.username(), body.password());
    return ResponseEntity.ok(response);
  }

  @PostMapping(path = "/refresh")
  public ResponseEntity<AuthenticateResponse> refresh(
      @Valid @RequestBody RefreshTokenRequest body) {
    AuthenticateResponse response = identityApi.refresh(body.refreshToken());
    return ResponseEntity.ok(response);
  }

  @PutMapping(path = "/user/password")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> changeOwnPassword(
      @Valid @RequestBody ChangePasswordRequest body, @AuthenticationPrincipal Jwt jwt) {
    identityApi.changeOwnPassword(jwt.getSubject(), body.currentPassword(), body.newPassword());
    return ResponseEntity.noContent().build();
  }

  public record TokenBody(
      @NotBlank(message = "Only grant_type=password is supported") String grantType,
      @NotBlank(message = "Username is required") String username,
      @NotBlank(message = "Password is required") String password) {}
}
