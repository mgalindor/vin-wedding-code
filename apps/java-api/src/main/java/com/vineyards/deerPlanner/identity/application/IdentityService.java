package com.vineyards.deerPlanner.identity.application;

import com.nimbusds.jwt.JWTClaimsSet;
import com.vineyards.deerPlanner.identity.application.port.UserOutPort;
import com.vineyards.deerPlanner.identity.domain.User;
import com.vineyards.deerPlanner.identity.facade.AuthenticateResponse;
import com.vineyards.deerPlanner.identity.facade.IdentityInPort;
import com.vineyards.deerPlanner.identity.facade.UserLoggedInAuditedEvent;
import com.vineyards.deerPlanner.identity.facade.UserPasswordChangedAuditedEvent;
import com.vineyards.deerPlanner.identity.facade.UserProfileResponse;
import com.vineyards.deerPlanner.shared.exceptions.InvalidCredentialsException;
import com.vineyards.deerPlanner.shared.exceptions.UserNotFoundException;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticatorInPort;
import com.vineyards.deerPlanner.shared.security.JwtIssuerOutPort;
import java.time.Instant;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Application
public class IdentityService implements IdentityInPort {

  // A valid bcrypt hash whose plaintext is meaningless. We only ever feed it to
  // PasswordEncoder.matches() when the user does not exist, so the result is discarded —
  // the goal is to keep the comparison time constant and avoid leaking which arm failed.
  private static final String DUMMY_BCRYPT_HASH =
      "$2a$12$CwTycUXWue0Thq9StjUM0uJ8G8e1xJ8Z5Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z";

  private final UserOutPort userRepository;
  private final JwtIssuerOutPort jwtIssuer;
  private final JwtAuthenticatorInPort jwtAuthenticator;
  private final PasswordEncoder passwordEncoder;
  private final ApplicationEventPublisher publisher;

  @Override
  @Transactional
  public AuthenticateResponse authenticate(String rawUsername, String rawPassword) {
    String username = normalize(rawUsername);

    User user = userRepository.findByUsername(username).orElse(null);

    // Constant-time comparison even when the user is missing, to avoid timing-based enumeration.
    String hashToCompare = user != null ? user.getPasswordHash() : DUMMY_BCRYPT_HASH;
    boolean passwordOk =
        passwordEncoder.matches(rawPassword != null ? rawPassword : "", hashToCompare);

    if (user == null || !passwordOk || !user.isActive()) {
      log.debug("Authentication failed for username={}", username);
      throw new InvalidCredentialsException();
    }

    userRepository.recordLogin(user.getId());
    Set<String> roleNames = roleNames(user.getRoles());
    publisher.publishEvent(new UserLoggedInAuditedEvent(user.getId(), roleNames, Instant.now()));
    log.info(
        "user.login userId={} username={} roles={}", user.getId(), user.getUsername(), roleNames);
    return issueTokens(user, roleNames);
  }

  @Override
  @Transactional
  public AuthenticateResponse refresh(String refreshToken) {
    if (refreshToken == null || refreshToken.isBlank()) {
      throw new InvalidCredentialsException();
    }
    JWTClaimsSet claims = jwtAuthenticator.verifyRefreshToken(refreshToken);
    String userId = claims.getSubject();
    User user =
        userRepository.findById(userId).orElseThrow(() -> new InvalidCredentialsException());
    if (!user.isActive()) {
      log.debug("Refresh denied — user disabled userId={}", userId);
      throw new InvalidCredentialsException();
    }
    Set<String> roleNames = roleNames(user.getRoles());
    log.info("user.refresh userId={} username={}", user.getId(), user.getUsername());
    return issueTokens(user, roleNames);
  }

  @Override
  @Transactional
  public void changeOwnPassword(String userId, String currentPassword, String newPassword) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
      log.debug("Password change rejected — wrong current password userId={}", userId);
      throw new InvalidCredentialsException();
    }
    String hash = passwordEncoder.encode(newPassword);
    userRepository.updatePassword(user.getId(), hash);
    publisher.publishEvent(new UserPasswordChangedAuditedEvent(user.getId(), Instant.now()));
    log.info("user.password-changed-self userId={}", user.getId());
  }

  @Override
  @Transactional(readOnly = true)
  public UserProfileResponse getProfile(String userId) {
    return userRepository
        .findActiveById(userId)
        .map(UserProfileResponse::from)
        .orElseThrow(() -> new UserNotFoundException(userId));
  }

  private AuthenticateResponse issueTokens(User user, Set<String> roleNames) {
    String accessToken =
        jwtIssuer.issueAccessToken(
            user.getId(), user.getUsername(), user.getDisplayName(), user.getEmail(), roleNames);
    String refreshToken = jwtIssuer.issueRefreshToken(user.getId(), user.getUsername(), roleNames);
    return AuthenticateResponse.bearer(
        accessToken,
        jwtIssuer.accessTokenTtlSeconds(),
        refreshToken,
        jwtIssuer.refreshTokenTtlSeconds());
  }

  private static String normalize(String value) {
    return value == null ? "" : value.trim().toLowerCase();
  }

  private static Set<String> roleNames(Set<com.vineyards.deerPlanner.identity.domain.Role> roles) {
    return roles.stream()
        .map(com.vineyards.deerPlanner.identity.domain.Role::name)
        .collect(Collectors.toUnmodifiableSet());
  }
}
