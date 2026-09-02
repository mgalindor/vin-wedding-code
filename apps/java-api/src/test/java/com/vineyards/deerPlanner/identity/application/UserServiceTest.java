package com.vineyards.deerPlanner.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vineyards.deerPlanner.identity.application.port.UserOutPort;
import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.domain.User;
import com.vineyards.deerPlanner.identity.facade.dto.CreateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UpdateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UserResponse;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  private static final String ADMIN_ID = "admin-id";
  private static final String TARGET_ID = "target-id";
  private static final String DEFAULT_ADMIN_USERNAME = "admin@deer";
  private static final String USERNAME_SUFFIX = "@deer";

  @Mock UserOutPort userRepository;

  private PasswordEncoder encoder;
  private IdentityProperties props;
  private UserService service;

  @BeforeEach
  void setUp() {
    encoder = new BCryptPasswordEncoder(12);
    props = new IdentityProperties();
    props.setUsernameSuffix(USERNAME_SUFFIX);
    props.setProtectedDefaultAdmin(DEFAULT_ADMIN_USERNAME);
    service = new UserService(userRepository, encoder, props);
  }

  // ============================================================
  // composeUsername (covered indirectly through createUser tests)
  // ============================================================

  @Nested
  class CreateUser {

    @Test
    void createUser_whenUsernameAvailable_appendsSuffixAndHashesPassword() {
      CreateUserDto dto =
          new CreateUserDto(
              "miguel",
              "Miguel Doe",
              "miguel@example.com",
              "+1234",
              "hunter2hunter",
              EnumSet.of(Role.EventOrganizer));
      when(userRepository.findByUsername("miguel@deer")).thenReturn(Optional.empty());
      when(userRepository.create(any(User.class)))
          .thenAnswer(
              inv -> {
                User u = inv.getArgument(0);
                return User.builder()
                    .id("new-user-id")
                    .username(u.getUsername())
                    .displayName(u.getDisplayName())
                    .email(u.getEmail())
                    .phone(u.getPhone())
                    .passwordHash(u.getPasswordHash())
                    .isActive(true)
                    .roles(u.getRoles())
                    .build();
              });

      UserResponse response = service.createUser(dto, ADMIN_ID);

      assertThat(response.id()).isEqualTo("new-user-id");
      assertThat(response.username()).isEqualTo("miguel@deer");
      assertThat(response.displayName()).isEqualTo("Miguel Doe");
      assertThat(response.roles()).containsExactly(Role.EventOrganizer);

      ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
      verify(userRepository).create(captor.capture());
      User persisted = captor.getValue();
      assertThat(persisted.getUsername()).isEqualTo("miguel@deer");
      assertThat(persisted.isActive()).isTrue();
      assertThat(encoder.matches("hunter2hunter", persisted.getPasswordHash())).isTrue();
    }

    @Test
    void createUser_whenUsernameAlreadyExists_throwsBusinessError() {
      CreateUserDto dto =
          new CreateUserDto(
              "miguel", "Miguel", null, null, "hunter2hunter", EnumSet.of(Role.EventOrganizer));
      when(userRepository.findByUsername("miguel@deer"))
          .thenReturn(Optional.of(User.builder().username("miguel@deer").build()));

      assertThatThrownBy(() -> service.createUser(dto, ADMIN_ID))
          .isInstanceOf(BusinessError.class)
          .hasMessageContaining("user.username-already-exists");
      verify(userRepository, never()).create(any(User.class));
    }

    @Test
    void createUser_whenSlugContainsAt_throwsBusinessError() {
      CreateUserDto dto =
          new CreateUserDto(
              "miguel@deer",
              "Miguel",
              null,
              null,
              "hunter2hunter",
              EnumSet.of(Role.EventOrganizer));

      assertThatThrownBy(() -> service.createUser(dto, ADMIN_ID))
          .isInstanceOf(BusinessError.class)
          .hasMessageContaining("username.must-not-contain-at");
      verify(userRepository, never()).create(any(User.class));
    }

    @Test
    void createUser_normalisesUsernameToLowercase() {
      CreateUserDto dto =
          new CreateUserDto(
              "Miguel", "M", null, null, "hunter2hunter", EnumSet.of(Role.EventOrganizer));
      when(userRepository.findByUsername("miguel@deer")).thenReturn(Optional.empty());
      when(userRepository.create(any(User.class)))
          .thenAnswer(
              inv -> {
                User u = inv.getArgument(0);
                return User.builder()
                    .id("id")
                    .username(u.getUsername())
                    .displayName(u.getDisplayName())
                    .passwordHash(u.getPasswordHash())
                    .isActive(true)
                    .roles(u.getRoles())
                    .build();
              });

      UserResponse response = service.createUser(dto, ADMIN_ID);

      assertThat(response.username()).isEqualTo("miguel@deer");
    }
  }

  // ============================================================
  // Get
  // ============================================================

  @Nested
  class GetUser {

    @Test
    void getUser_whenActorIsAdmin_returnsAnyUser() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

      UserResponse response = service.getUser(TARGET_ID, ADMIN_ID, true);

      assertThat(response.id()).isEqualTo(TARGET_ID);
      assertThat(response.username()).isEqualTo("alice@deer");
    }

    @Test
    void getUser_whenActorIsOwner_returnsOwnUser() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

      UserResponse response = service.getUser(TARGET_ID, TARGET_ID, false);

      assertThat(response.id()).isEqualTo(TARGET_ID);
    }

    @Test
    void getUser_whenActorIsNeitherAdminNorOwner_throwsNotFound() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

      assertThatThrownBy(() -> service.getUser(TARGET_ID, "intruder-id", false))
          .isInstanceOf(ResourceNotFoundError.class);
    }

    @Test
    void getUser_whenUserDoesNotExist_throwsNotFound() {
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.getUser(TARGET_ID, ADMIN_ID, true))
          .isInstanceOf(ResourceNotFoundError.class);
    }
  }

  // ============================================================
  // Update
  // ============================================================

  @Nested
  class UpdateUser {

    @Test
    void updateUser_whenOwnerUpdatesOwnDisplayName_appliesChange() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));
      when(userRepository.update(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

      UpdateUserDto dto = new UpdateUserDto("New Name", null, null, null, null);
      UserResponse response = service.updateUser(TARGET_ID, dto, TARGET_ID, false);

      assertThat(response.displayName()).isEqualTo("New Name");
      assertThat(response.username()).isEqualTo("alice@deer");
    }

    @Test
    void updateUser_whenOwnerTriesToChangeRoles_silentlyIgnoresThem() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));
      when(userRepository.update(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

      UpdateUserDto dto =
          new UpdateUserDto("Alice", null, null, null, EnumSet.of(Role.Administrator));
      UserResponse response = service.updateUser(TARGET_ID, dto, TARGET_ID, false);

      // Roles unchanged (still EventOrganizer from sampleUser)
      assertThat(response.roles()).containsExactly(Role.EventOrganizer);
    }

    @Test
    void updateUser_whenAdminChangesRoles_appliesThem() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));
      when(userRepository.update(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

      UpdateUserDto dto =
          new UpdateUserDto(
              null, null, null, null, EnumSet.of(Role.Administrator, Role.EventOrganizer));
      UserResponse response = service.updateUser(TARGET_ID, dto, ADMIN_ID, true);

      assertThat(response.roles())
          .containsExactlyInAnyOrder(Role.Administrator, Role.EventOrganizer);
    }

    @Test
    void updateUser_whenPasswordProvided_hashesIt() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));
      ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
      when(userRepository.update(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

      UpdateUserDto dto = new UpdateUserDto(null, null, null, "newsecret1", null);
      service.updateUser(TARGET_ID, dto, TARGET_ID, false);

      User persisted = captor.getValue();
      assertThat(persisted.getPasswordHash()).startsWith("$2a$");
      assertThat(encoder.matches("newsecret1", persisted.getPasswordHash())).isTrue();
    }

    @Test
    void updateUser_whenAllFieldsNull_returnsCurrentStateWithoutCallingRepo() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

      UpdateUserDto dto = new UpdateUserDto(null, null, null, null, null);
      UserResponse response = service.updateUser(TARGET_ID, dto, TARGET_ID, false);

      assertThat(response.id()).isEqualTo(TARGET_ID);
      verify(userRepository, never()).update(any(User.class));
    }

    @Test
    void updateUser_whenNotAdminNotOwner_throwsNotFound() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

      UpdateUserDto dto = new UpdateUserDto("New", null, null, null, null);
      assertThatThrownBy(() -> service.updateUser(TARGET_ID, dto, "intruder-id", false))
          .isInstanceOf(ResourceNotFoundError.class);
      verify(userRepository, never()).update(any(User.class));
    }
  }

  // ============================================================
  // Disable / Enable
  // ============================================================

  @Nested
  class DisableEnable {

    @Test
    void disableUser_whenAdminDisablesNormalUser_flipsToInactive() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      target.setActive(true);
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

      service.disableUser(TARGET_ID, ADMIN_ID);

      verify(userRepository).setActive(TARGET_ID, false);
    }

    @Test
    void disableUser_whenTargetIsDefaultAdmin_throwsBusinessError() {
      User admin = sampleUser(ADMIN_ID, DEFAULT_ADMIN_USERNAME);
      admin.setActive(true);
      when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(admin));

      assertThatThrownBy(() -> service.disableUser(ADMIN_ID, ADMIN_ID))
          .isInstanceOf(BusinessError.class)
          .hasMessageContaining("user.cannot-disable-default-admin");
      verify(userRepository, never()).setActive(anyString(), anyBoolean());
    }

    @Test
    void enableUser_whenTargetIsDefaultAdmin_succeeds() {
      User admin = sampleUser(ADMIN_ID, DEFAULT_ADMIN_USERNAME);
      admin.setActive(false);
      when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(admin));

      service.enableUser(ADMIN_ID, ADMIN_ID);

      verify(userRepository).setActive(ADMIN_ID, true);
    }

    @Test
    void disableUser_whenAlreadyDisabled_isNoOp() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      target.setActive(false);
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

      service.disableUser(TARGET_ID, ADMIN_ID);

      verify(userRepository, never()).setActive(anyString(), anyBoolean());
    }

    @Test
    void disableUser_whenUserDoesNotExist_throwsNotFound() {
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.disableUser(TARGET_ID, ADMIN_ID))
          .isInstanceOf(ResourceNotFoundError.class);
      verify(userRepository, never()).setActive(anyString(), anyBoolean());
    }
  }

  // ============================================================
  // Delete
  // ============================================================

  @Nested
  class Delete {

    @Test
    void deleteUser_whenTargetIsRegularUser_callsRepositoryDelete() {
      User target = sampleUser(TARGET_ID, "alice@deer");
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

      service.deleteUser(TARGET_ID, ADMIN_ID);

      verify(userRepository).delete(TARGET_ID);
    }

    @Test
    void deleteUser_whenTargetIsDefaultAdmin_throwsBusinessError() {
      User admin = sampleUser(ADMIN_ID, DEFAULT_ADMIN_USERNAME);
      when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(admin));

      assertThatThrownBy(() -> service.deleteUser(ADMIN_ID, ADMIN_ID))
          .isInstanceOf(BusinessError.class)
          .hasMessageContaining("user.cannot-delete-default-admin");
      verify(userRepository, never()).delete(anyString());
    }

    @Test
    void deleteUser_whenUserDoesNotExist_throwsNotFound() {
      when(userRepository.findById(TARGET_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.deleteUser(TARGET_ID, ADMIN_ID))
          .isInstanceOf(ResourceNotFoundError.class);
      verify(userRepository, never()).delete(anyString());
    }
  }

  // ============================================================
  // List
  // ============================================================

  @Nested
  class ListUsers {

    @Test
    void listUsers_returnsPagedResponses() {
      User a = sampleUser("id-1", "alice@deer");
      User b = sampleUser("id-2", "bob@deer");
      org.springframework.data.domain.Page<User> page =
          new org.springframework.data.domain.PageImpl<>(List.of(a, b));
      org.mockito.ArgumentCaptor<
              org.springframework.data.jpa.domain.Specification<
                  com.vineyards.deerPlanner.identity.outbound.UserEntity>>
          specCaptor =
              org.mockito.ArgumentCaptor.forClass(
                  org.springframework.data.jpa.domain.Specification.class);
      org.mockito.ArgumentCaptor<org.springframework.data.domain.Pageable> pageableCaptor =
          org.mockito.ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
      when(userRepository.search(specCaptor.capture(), pageableCaptor.capture())).thenReturn(page);

      PagedResponse<UserResponse> response =
          service.listUsers(null, null, null, org.springframework.data.domain.Pageable.unpaged());

      assertThat(response.items()).hasSize(2);
      assertThat(response.items())
          .extracting(UserResponse::username)
          .containsExactly("alice@deer", "bob@deer");
      assertThat(response.total()).isEqualTo(2);
      assertThat(response.hasMore()).isFalse();
    }

    @Test
    void listUsers_passesFiltersThrough() {
      org.springframework.data.domain.Page<User> page =
          new org.springframework.data.domain.PageImpl<>(List.of());
      when(userRepository.search(
              org.mockito.ArgumentMatchers.any(
                  org.springframework.data.jpa.domain.Specification.class),
              org.mockito.ArgumentMatchers.any(org.springframework.data.domain.Pageable.class)))
          .thenReturn(page);

      service.listUsers(
          "al", "EventOrganizer", true, org.springframework.data.domain.PageRequest.of(0, 10));

      verify(userRepository)
          .search(
              org.mockito.ArgumentMatchers.any(
                  org.springframework.data.jpa.domain.Specification.class),
              eq(org.springframework.data.domain.PageRequest.of(0, 10)));
    }
  }

  // ============================================================
  // Helpers
  // ============================================================

  private static User sampleUser(String id, String username) {
    return User.builder()
        .id(id)
        .username(username)
        .displayName("Display " + username)
        .email(username + "@example.com")
        .phone(null)
        .passwordHash("$2a$12$validbcrypthashforpasswordhunter20000000000000000000000")
        .isActive(true)
        .roles(EnumSet.of(Role.EventOrganizer))
        .lastLoginAt(null)
        .createdAt(Instant.parse("2026-08-01T09:00:00Z"))
        .updatedAt(Instant.parse("2026-08-01T09:00:00Z"))
        .build();
  }
}
