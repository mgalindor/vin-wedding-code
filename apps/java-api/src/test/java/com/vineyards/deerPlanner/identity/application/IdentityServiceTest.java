package com.vineyards.deerPlanner.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nimbusds.jwt.JWTClaimsSet;
import com.vineyards.deerPlanner.identity.application.port.UserOutPort;
import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.domain.User;
import com.vineyards.deerPlanner.identity.facade.AuthenticateResponse;
import com.vineyards.deerPlanner.identity.facade.UserProfileResponse;
import com.vineyards.deerPlanner.shared.exceptions.InvalidCredentialsException;
import com.vineyards.deerPlanner.shared.exceptions.UserNotFoundException;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticatorInPort;
import com.vineyards.deerPlanner.shared.security.JwtIssuerOutPort;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class IdentityServiceTest {

  @Mock UserOutPort userRepository;
  @Mock JwtIssuerOutPort jwtIssuer;
  @Mock JwtAuthenticatorInPort jwtAuthenticator;

  private PasswordEncoder encoder;
  private IdentityService service;

  private static final String USER_ID = "user-1";
  private static final String USERNAME = "alice";
  private static final String DISPLAY_NAME = "Alice Doe";
  private static final String EMAIL = "alice@example.com";
  private static final String PASSWORD = "hunter2";
  private static final String STORED_HASH;

  static {
    BCryptPasswordEncoder staticEncoder = new BCryptPasswordEncoder(12);
    STORED_HASH = staticEncoder.encode(PASSWORD);
  }

  @BeforeEach
  void setUp() {
    encoder = new BCryptPasswordEncoder(12);
    service = new IdentityService(userRepository, jwtIssuer, jwtAuthenticator, encoder);
  }

  private User activeUser(Set<Role> roles) {
    return User.builder()
        .id(USER_ID)
        .username(USERNAME)
        .displayName(DISPLAY_NAME)
        .email(EMAIL)
        .phone("+10000000000")
        .passwordHash(STORED_HASH)
        .isActive(true)
        .roles(roles)
        .lastLoginAt(Instant.now())
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  private void stubTokenIssuance() {
    when(jwtIssuer.accessTokenTtlSeconds()).thenReturn(3600L);
    when(jwtIssuer.refreshTokenTtlSeconds()).thenReturn(86400L);
    when(jwtIssuer.issueAccessToken(anyString(), anyString(), anyString(), anyString(), anySet()))
        .thenReturn("access.jwt");
    when(jwtIssuer.issueRefreshToken(anyString(), anyString(), anySet())).thenReturn("refresh.jwt");
  }

  @Nested
  class Authenticate {

    @Test
    void authenticate_whenCredentialsMatch_returnsBearerTokensAndRecordsLogin() {
      User user = activeUser(EnumSet.of(Role.EventOrganizer));
      when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
      stubTokenIssuance();

      AuthenticateResponse response = service.authenticate(USERNAME, PASSWORD);

      assertThat(response.accessToken()).isEqualTo("access.jwt");
      assertThat(response.tokenType()).isEqualTo("Bearer");
      assertThat(response.refreshToken()).isEqualTo("refresh.jwt");
      verify(userRepository).recordLogin(USER_ID);
      verify(jwtIssuer)
          .issueAccessToken(
              eq(USER_ID), eq(USERNAME), eq(DISPLAY_NAME), eq(EMAIL), eq(Set.of("EventOrganizer")));
    }

    @Test
    void authenticate_whenUsernameHasMixedCaseAndWhitespace_normalizesByTrimmingAndLowercasing() {
      User user = activeUser(EnumSet.of(Role.EventOrganizer));
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      stubTokenIssuance();

      service.authenticate("  Alice  ", PASSWORD);

      verify(userRepository).findByUsername("alice");
    }

    @Test
    void authenticate_whenUserHasBothRoles_passesFullRoleSetToIssuer() {
      User user = activeUser(EnumSet.of(Role.Administrator, Role.EventOrganizer));
      when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
      stubTokenIssuance();

      service.authenticate(USERNAME, PASSWORD);

      verify(jwtIssuer)
          .issueAccessToken(
              eq(USER_ID),
              anyString(),
              anyString(),
              anyString(),
              eq(Set.of("Administrator", "EventOrganizer")));
      verify(jwtIssuer)
          .issueRefreshToken(
              eq(USER_ID), eq(USERNAME), eq(Set.of("Administrator", "EventOrganizer")));
    }

    @Test
    void authenticate_whenUserDoesNotExist_throwsInvalidCredentials() {
      when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.authenticate(USERNAME, PASSWORD))
          .isInstanceOf(InvalidCredentialsException.class);

      verify(userRepository, never()).recordLogin(anyString());
      verify(jwtIssuer, never())
          .issueAccessToken(anyString(), anyString(), anyString(), anyString(), anySet());
      verify(jwtIssuer, never()).issueRefreshToken(anyString(), anyString(), anySet());
    }

    @Test
    void authenticate_whenPasswordDoesNotMatch_throwsInvalidCredentials() {
      User user = activeUser(EnumSet.of(Role.EventOrganizer));
      when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));

      assertThatThrownBy(() -> service.authenticate(USERNAME, "wrongpassword"))
          .isInstanceOf(InvalidCredentialsException.class);

      verify(userRepository, never()).recordLogin(anyString());
    }

    @Test
    void authenticate_whenUserIsInactive_throwsInvalidCredentials() {
      User inactive =
          User.builder()
              .id(USER_ID)
              .username(USERNAME)
              .displayName(DISPLAY_NAME)
              .email(EMAIL)
              .phone(null)
              .passwordHash(STORED_HASH)
              .isActive(false)
              .roles(EnumSet.of(Role.EventOrganizer))
              .lastLoginAt(Instant.now())
              .createdAt(Instant.now())
              .updatedAt(Instant.now())
              .build();
      when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(inactive));

      assertThatThrownBy(() -> service.authenticate(USERNAME, PASSWORD))
          .isInstanceOf(InvalidCredentialsException.class);

      verify(userRepository, never()).recordLogin(USER_ID);
    }

    @Test
    void authenticate_whenPasswordIsNull_treatsAsEmptyStringToKeepConstantTimeShape() {
      User user = activeUser(EnumSet.of(Role.EventOrganizer));
      when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));

      assertThatThrownBy(() -> service.authenticate(USERNAME, null))
          .isInstanceOf(InvalidCredentialsException.class);
    }
  }

  @Nested
  class GetProfile {

    @Test
    void getProfile_whenActiveUserExists_returnsProfile() {
      User user = activeUser(EnumSet.of(Role.EventOrganizer));
      when(userRepository.findActiveById(USER_ID)).thenReturn(Optional.of(user));

      UserProfileResponse profile = service.getProfile(USER_ID);

      assertThat(profile).isNotNull();
      assertThat(profile.id()).isEqualTo(USER_ID);
    }

    @Test
    void getProfile_whenNoActiveUserMatches_throwsUserNotFound() {
      when(userRepository.findActiveById(USER_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.getProfile(USER_ID))
          .isInstanceOf(UserNotFoundException.class)
          .hasMessageContaining(USER_ID);
    }
  }

  // ============================================================
  // Refresh
  // ============================================================

  @Nested
  class Refresh {
    @Test
    void refresh_whenClaimsAreValid_returnsNewTokenPair() {
      User user = activeUser(EnumSet.of(Role.EventOrganizer));
      user.setActive(true);
      JWTClaimsSet claims = new JWTClaimsSet.Builder().subject(USER_ID).build();
      when(jwtAuthenticator.verifyRefreshToken("valid-refresh")).thenReturn(claims);
      when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
      stubTokenIssuance();

      AuthenticateResponse response = service.refresh("valid-refresh");

      assertThat(response.accessToken()).isEqualTo("access.jwt");
      assertThat(response.refreshToken()).isEqualTo("refresh.jwt");
      verify(jwtIssuer).issueAccessToken(eq(USER_ID), eq(USERNAME), any(), any(), anySet());
      verify(jwtIssuer).issueRefreshToken(eq(USER_ID), eq(USERNAME), anySet());
    }

    @Test
    void refresh_whenUserIsDisabled_throwsInvalidCredentials() {
      User user = activeUser(EnumSet.of(Role.EventOrganizer));
      user.setActive(false);
      JWTClaimsSet claims = new JWTClaimsSet.Builder().subject(USER_ID).build();
      when(jwtAuthenticator.verifyRefreshToken("valid-refresh")).thenReturn(claims);
      when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

      assertThatThrownBy(() -> service.refresh("valid-refresh"))
          .isInstanceOf(InvalidCredentialsException.class);
      verify(jwtIssuer, never())
          .issueAccessToken(anyString(), anyString(), anyString(), anyString(), anySet());
    }

    @Test
    void refresh_whenUserDoesNotExist_throwsInvalidCredentials() {
      JWTClaimsSet claims = new JWTClaimsSet.Builder().subject(USER_ID).build();
      when(jwtAuthenticator.verifyRefreshToken("valid-refresh")).thenReturn(claims);
      when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.refresh("valid-refresh"))
          .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void refresh_whenTokenIsBlank_throwsInvalidCredentials() {
      assertThatThrownBy(() -> service.refresh("")).isInstanceOf(InvalidCredentialsException.class);
      verify(jwtAuthenticator, never()).verifyRefreshToken(anyString());
    }
  }

  // ============================================================
  // Change own password
  // ============================================================

  @Nested
  class ChangeOwnPassword {

    @Test
    void changeOwnPassword_whenCurrentPasswordIsCorrect_hashesAndPersistsNew() {
      User user = activeUser(EnumSet.of(Role.EventOrganizer));
      when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

      service.changeOwnPassword(USER_ID, PASSWORD, "FreshPass1234!");

      org.mockito.ArgumentCaptor<String> hashCaptor =
          org.mockito.ArgumentCaptor.forClass(String.class);
      verify(userRepository).updatePassword(eq(USER_ID), hashCaptor.capture());
      String storedHash = hashCaptor.getValue();
      assertThat(storedHash).startsWith("$2a$");
      assertThat(encoder.matches("FreshPass1234!", storedHash)).isTrue();
    }

    @Test
    void changeOwnPassword_whenCurrentPasswordIsWrong_throwsInvalidCredentials() {
      User user = activeUser(EnumSet.of(Role.EventOrganizer));
      when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

      assertThatThrownBy(() -> service.changeOwnPassword(USER_ID, "WRONG", "NewPass1234!"))
          .isInstanceOf(InvalidCredentialsException.class);
      verify(userRepository, never()).updatePassword(anyString(), anyString());
    }

    @Test
    void changeOwnPassword_whenUserDoesNotExist_throwsUserNotFound() {
      when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.changeOwnPassword(USER_ID, PASSWORD, "NewPass1234!"))
          .isInstanceOf(UserNotFoundException.class);
      verify(userRepository, never()).updatePassword(anyString(), anyString());
    }
  }
}
