package com.vineyards.deerPlanner.identity.application;

import com.vineyards.deerPlanner.identity.application.port.UserOutPort;
import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.domain.User;
import com.vineyards.deerPlanner.identity.facade.AuthenticateResponse;
import com.vineyards.deerPlanner.identity.facade.IdentityInPort;
import com.vineyards.deerPlanner.identity.facade.UserProfileResponse;
import com.vineyards.deerPlanner.shared.exceptions.InvalidCredentialsException;
import com.vineyards.deerPlanner.shared.exceptions.UserNotFoundException;
import com.vineyards.deerPlanner.shared.security.JwtIssuerOutPort;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Application
public class IdentityService implements IdentityInPort {

  private static final String DUMMY_BCRYPT_HASH =
      "$2a$12$CwTycUXWue0Thq9StjUM0uJ8G8e1xJ8Z5Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z";

  private final UserOutPort userRepository;
  private final JwtIssuerOutPort jwtIssuer;
  private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

  @Override
  @Transactional
  public AuthenticateResponse authenticate(String rawUsername, String rawPassword) {
    String username = normalize(rawUsername);

    User user = userRepository.findByUsername(username).orElse(null);

    // Constant-time comparison even when the user is missing, to avoid timing-based enumeration.
    String hashToCompare = user != null ? user.getPasswordHash() : DUMMY_BCRYPT_HASH;
    boolean passwordOk = encoder.matches(rawPassword != null ? rawPassword : "", hashToCompare);

    if (user == null || !passwordOk || !user.isActive()) {
      log.debug("Authentication failed for username={}", username);
      throw new InvalidCredentialsException();
    }

    userRepository.recordLogin(user.getId());

    Role primaryRole = pickPrimaryRole(user.getRoles());
    String accessToken =
        jwtIssuer.issueAccessToken(
            user.getId(),
            user.getUsername(),
            user.getDisplayName(),
            user.getEmail(),
            primaryRole.name());
    String refreshToken =
        jwtIssuer.issueRefreshToken(user.getId(), user.getUsername(), primaryRole.name());

    log.info(
        "user.login userId={} username={} role={}", user.getId(), user.getUsername(), primaryRole);

    return AuthenticateResponse.bearer(
        accessToken,
        jwtIssuer.accessTokenTtlSeconds(),
        refreshToken,
        jwtIssuer.refreshTokenTtlSeconds());
  }

  @Override
  @Transactional(readOnly = true)
  public UserProfileResponse getProfile(String userId) {
    return userRepository
        .findActiveById(userId)
        .map(UserProfileResponse::from)
        .orElseThrow(() -> new UserNotFoundException(userId));
  }

  private static String normalize(String value) {
    return value == null ? "" : value.trim().toLowerCase();
  }

  // Picks a single role to embed in the JWT. Administrators also acting as EventOrganizers get
  // Administrator as the primary; pure EventOrganizers get EventOrganizer. The full set is
  // still consulted at the route guard â€” a user with both roles can call any role-restricted
  // endpoint as long as one of their roles is allowed.
  private static Role pickPrimaryRole(Set<Role> roles) {
    if (roles.contains(Role.Administrator)) {
      return Role.Administrator;
    }
    return roles.iterator().next();
  }
}
