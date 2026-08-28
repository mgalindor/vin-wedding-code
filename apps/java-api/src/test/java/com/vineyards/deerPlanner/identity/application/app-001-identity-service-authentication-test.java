package com.vineyards.deerPlanner.identity.application;

import com.vineyards.deerPlanner.identity.application.IdentityService;
import com.vineyards.deerPlanner.identity.application.port.UserRepository;
import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.domain.User;
import com.vineyards.deerPlanner.identity.facade.AuthenticateResponse;
import com.vineyards.deerPlanner.identity.facade.UserProfileResponse;
import com.vineyards.deerPlanner.shared.exceptions.InvalidCredentialsException;
import com.vineyards.deerPlanner.shared.exceptions.UserNotFoundException;
import com.vineyards.deerPlanner.shared.security.JwtIssuerPort;
import com.vineyards.deerPlanner.shared.security.PasswordEncoderPort;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class App001IdentityServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoderPort passwordEncoder;
    @Mock JwtIssuerPort jwtIssuer;

    @InjectMocks IdentityService service;

    private static final String STORED_HASH = "stored-bcrypt-hash";
    private static final String USER_ID = "user-1";
    private static final String USERNAME = "alice";
    private static final String DISPLAY_NAME = "Alice Doe";
    private static final String EMAIL = "alice@example.com";

    private User activeUser(Set<Role> roles) {
        return new User(
            USER_ID,
            USERNAME,
            DISPLAY_NAME,
            EMAIL,
            "+10000000000",
            STORED_HASH,
            true,
            null,
            OffsetDateTime.now(),
            OffsetDateTime.now(),
            roles
        );
    }

    private void stubTokenIssuance() {
        when(jwtIssuer.accessTokenTtlSeconds()).thenReturn(3600L);
        when(jwtIssuer.refreshTokenTtlSeconds()).thenReturn(86400L);
        when(jwtIssuer.issueAccessToken(anyString(), anyString(), anyString(), anyString(), anyString()))
            .thenReturn("access.jwt");
        when(jwtIssuer.issueRefreshToken(anyString(), anyString(), anyString()))
            .thenReturn("refresh.jwt");
    }

    @Nested
    class Authenticate {

        @Test
        void returnsBearerTokensAndRecordsLogin_whenCredentialsMatch() {
            User user = activeUser(EnumSet.of(Role.EventOrganizer));
            when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("hunter2", STORED_HASH)).thenReturn(true);
            stubTokenIssuance();

            AuthenticateResponse response = service.authenticate(USERNAME, "hunter2");

            assertThat(response.accessToken()).isEqualTo("access.jwt");
            assertThat(response.tokenType()).isEqualTo("Bearer");
            assertThat(response.refreshToken()).isEqualTo("refresh.jwt");
            verify(userRepository).recordLogin(USER_ID);
            verify(jwtIssuer).issueAccessToken(
                eq(USER_ID), eq(USERNAME), eq(DISPLAY_NAME), eq(EMAIL), eq("EventOrganizer"));
        }

        @Test
        void normalizesUsernameByTrimmingAndLowercasing() {
            User user = activeUser(EnumSet.of(Role.EventOrganizer));
            when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("hunter2", STORED_HASH)).thenReturn(true);
            stubTokenIssuance();

            service.authenticate("  Alice  ", "hunter2");

            verify(userRepository).findByUsername("alice");
        }

        @Test
        void selectsAdministratorAsPrimaryRole_whenUserHasBothRoles() {
            User user = activeUser(EnumSet.of(Role.Administrator, Role.EventOrganizer));
            when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
            stubTokenIssuance();

            service.authenticate(USERNAME, "hunter2");

            verify(jwtIssuer).issueAccessToken(
                eq(USER_ID), anyString(), anyString(), anyString(), eq("Administrator"));
        }

        @Test
        void throwsInvalidCredentials_whenUserDoesNotExist() {
            when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

            assertThatThrownBy(() -> service.authenticate(USERNAME, "hunter2"))
                .isInstanceOf(InvalidCredentialsException.class);

            verify(userRepository, never()).recordLogin(anyString());
            verify(jwtIssuer, never()).issueAccessToken(anyString(), anyString(), anyString(), anyString(), anyString());
            verify(jwtIssuer, never()).issueRefreshToken(anyString(), anyString(), anyString());
            // Constant-time check: the encoder is still invoked against the dummy hash.
            verify(passwordEncoder, times(1)).matches(eq("hunter2"), anyString());
        }

        @Test
        void throwsInvalidCredentials_whenPasswordDoesNotMatch() {
            User user = activeUser(EnumSet.of(Role.EventOrganizer));
            when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("hunter2", STORED_HASH)).thenReturn(false);

            assertThatThrownBy(() -> service.authenticate(USERNAME, "hunter2"))
                .isInstanceOf(InvalidCredentialsException.class);

            verify(userRepository, never()).recordLogin(anyString());
        }

        @Test
        void throwsInvalidCredentials_whenUserIsInactive() {
            User inactive = new User(
                USER_ID, USERNAME, DISPLAY_NAME, EMAIL, null, STORED_HASH,
                false, null, OffsetDateTime.now(), OffsetDateTime.now(),
                EnumSet.of(Role.EventOrganizer)
            );
            when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(inactive));
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

            assertThatThrownBy(() -> service.authenticate(USERNAME, "hunter2"))
                .isInstanceOf(InvalidCredentialsException.class);

            verify(userRepository, never()).recordLogin(anyString());
        }

        @Test
        void treatsNullPasswordAsEmptyString_toKeepConstantTimeShape() {
            User user = activeUser(EnumSet.of(Role.EventOrganizer));
            when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("", STORED_HASH)).thenReturn(false);

            assertThatThrownBy(() -> service.authenticate(USERNAME, null))
                .isInstanceOf(InvalidCredentialsException.class);

            verify(passwordEncoder).matches(eq(""), eq(STORED_HASH));
        }
    }

    @Nested
    class GetProfile {

        @Test
        void returnsProfile_whenActiveUserExists() {
            User user = activeUser(EnumSet.of(Role.EventOrganizer));
            when(userRepository.findActiveById(USER_ID)).thenReturn(Optional.of(user));

            UserProfileResponse profile = service.getProfile(USER_ID);

            assertThat(profile).isNotNull();
            assertThat(profile.id()).isEqualTo(USER_ID);
        }

        @Test
        void throwsUserNotFound_whenNoActiveUserMatches() {
            when(userRepository.findActiveById(USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getProfile(USER_ID))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining(USER_ID);
        }
    }
}
