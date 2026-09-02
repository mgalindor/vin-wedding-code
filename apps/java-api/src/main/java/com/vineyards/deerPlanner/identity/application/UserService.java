package com.vineyards.deerPlanner.identity.application;

import com.vineyards.deerPlanner.identity.application.port.UserOutPort;
import com.vineyards.deerPlanner.identity.domain.User;
import com.vineyards.deerPlanner.identity.facade.UserInPort;
import com.vineyards.deerPlanner.identity.facade.dto.CreateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UpdateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UserResponse;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import jakarta.persistence.criteria.Predicate;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application-layer orchestrator for user CRUD operations. Authorization (admin vs owner) is
 * already enforced by the inbound controller via {@code @PreAuthorize}; this service applies the
 * remaining business rules: username uniqueness, default-admin protection, soft-delete guards, and
 * the rule that only admins can change roles.
 */
@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class UserService implements UserInPort {

  private final UserOutPort userRepository;
  private final PasswordEncoder passwordEncoder;
  private final IdentityProperties props;

  // ---------- Create ----------

  @Override
  @Transactional
  public UserResponse createUser(CreateUserDto dto, String actorUserId) {
    String fullUsername = composeUsername(dto.username());

    if (userRepository.findByUsername(fullUsername).isPresent()) {
      throw new BusinessError("user.username-already-exists", fullUsername);
    }

    String hash = passwordEncoder.encode(dto.password());

    User toCreate =
        User.builder()
            .username(fullUsername)
            .displayName(dto.displayName())
            .email(dto.email())
            .phone(dto.phone())
            .passwordHash(hash)
            .isActive(true)
            .roles(dto.roles())
            .build();

    User created = userRepository.create(toCreate);
    log.info(
        "user.created userId={} username={} actorUserId={} roles={}",
        created.getId(),
        created.getUsername(),
        actorUserId,
        created.getRoles());
    return UserResponse.from(created);
  }

  // ---------- Read ----------

  @Override
  @Transactional(readOnly = true)
  public UserResponse getUser(String userId, String actorUserId, boolean actorIsAdmin) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundError("user", userId));
    // Non-admin callers may only read themselves. Admins can read anyone (even soft-deleted).
    if (!actorIsAdmin && !user.getId().equals(actorUserId)) {
      throw new ResourceNotFoundError("user", userId);
    }
    return UserResponse.from(user);
  }

  @Override
  @Transactional(readOnly = true)
  public PagedResponse<UserResponse> listUsers(
      String q, String role, Boolean isActive, Pageable pageable) {
    Specification<com.vineyards.deerPlanner.identity.outbound.UserEntity> spec =
        Specification.unrestricted();
    if (q != null && !q.isBlank()) {
      String pattern = "%" + q.toLowerCase().trim() + "%";
      spec =
          spec.and(
              (root, query, cb) -> {
                Predicate byUsername = cb.like(cb.lower(root.get("username")), pattern);
                Predicate byDisplayName = cb.like(cb.lower(root.get("displayName")), pattern);
                Predicate byEmail = cb.like(cb.lower(cb.coalesce(root.get("email"), "")), pattern);
                return cb.or(byUsername, byDisplayName, byEmail);
              });
    }
    if (isActive != null) {
      spec = spec.and((root, query, cb) -> cb.equal(root.get("isActive"), isActive));
    }
    if (role != null && !role.isBlank()) {
      spec =
          spec.and(
              (root, query, cb) -> {
                jakarta.persistence.criteria.Subquery<String> sub = query.subquery(String.class);
                jakarta.persistence.criteria.Root<
                        com.vineyards.deerPlanner.identity.outbound.UserRoleEntity>
                    roleRoot =
                        sub.from(com.vineyards.deerPlanner.identity.outbound.UserRoleEntity.class);
                sub.select(roleRoot.get("id").get("userId"))
                    .where(cb.equal(roleRoot.get("id").get("role"), role));
                return root.get("id").in(sub);
              });
    }
    Page<User> page = userRepository.search(spec, pageable);
    return PagedResponse.from(page, UserResponse::from);
  }

  // ---------- Update ----------

  @Override
  @Transactional
  public UserResponse updateUser(
      String userId, UpdateUserDto dto, String actorUserId, boolean actorIsAdmin) {
    User existing =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundError("user", userId));

    boolean anythingToDo =
        dto.displayName() != null
            || dto.email() != null
            || dto.phone() != null
            || dto.password() != null
            || dto.roles() != null;
    if (!anythingToDo) {
      // Nothing to update — return the current state without touching the DB.
      return UserResponse.from(existing);
    }

    boolean ownerEditingSelf = existing.getId().equals(actorUserId);
    boolean isAdmin = actorIsAdmin;

    if (!isAdmin && !ownerEditingSelf) {
      // Defense in depth — the controller's @PreAuthorize should already have refused this.
      throw new ResourceNotFoundError("user", userId);
    }

    String displayName = dto.displayName() != null ? dto.displayName() : existing.getDisplayName();
    String email = dto.email() != null ? dto.email() : existing.getEmail();
    String phone = dto.phone() != null ? dto.phone() : existing.getPhone();
    String passwordHash =
        dto.password() != null
            ? passwordEncoder.encode(dto.password())
            : existing.getPasswordHash();

    // Roles are admin-only. If the caller is not an admin and tried to set them, ignore silently
    // (don't reject — the UI may send the field unconditionally).
    Set<com.vineyards.deerPlanner.identity.domain.Role> roles =
        isAdmin && dto.roles() != null ? dto.roles() : existing.getRoles();

    User toUpdate =
        User.builder()
            .id(existing.getId())
            .username(existing.getUsername())
            .displayName(displayName)
            .email(email)
            .phone(phone)
            .passwordHash(passwordHash)
            .isActive(existing.isActive())
            .roles(roles)
            .lastLoginAt(existing.getLastLoginAt())
            .createdAt(existing.getCreatedAt())
            .build();

    User updated = userRepository.update(toUpdate);
    log.info(
        "user.updated userId={} actorUserId={} adminActor={} changedFields={}",
        updated.getId(),
        actorUserId,
        isAdmin,
        changedFields(dto));
    return UserResponse.from(updated);
  }

  private static String changedFields(UpdateUserDto dto) {
    java.util.List<String> fields = new java.util.ArrayList<>();
    if (dto.displayName() != null) fields.add("displayName");
    if (dto.email() != null) fields.add("email");
    if (dto.phone() != null) fields.add("phone");
    if (dto.password() != null) fields.add("password");
    if (dto.roles() != null) fields.add("roles");
    return String.join(",", fields);
  }

  // ---------- Disable / Enable ----------

  @Override
  @Transactional
  public void disableUser(String userId, String actorUserId) {
    changeActiveState(userId, false, actorUserId);
  }

  @Override
  @Transactional
  public void enableUser(String userId, String actorUserId) {
    changeActiveState(userId, true, actorUserId);
  }

  @Override
  @Transactional
  public void deleteUser(String userId, String actorUserId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundError("user", userId));

    if (user.getUsername().equalsIgnoreCase(props.getProtectedDefaultAdmin())) {
      // Same Rule 17 protection as disable. Deleting the default admin would lock the
      // platform out with no recovery path.
      throw new BusinessError("user.cannot-delete-default-admin");
    }

    userRepository.delete(user.getId());
    log.info("user.deleted userId={} actorUserId={}", user.getId(), actorUserId);
  }

  private void changeActiveState(String userId, boolean target, String actorUserId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundError("user", userId));

    // Rule 17 (ADR-05): the default admin cannot be disabled. Re-enabling is allowed (idempotent
    // and safe), but disabling must be refused.
    if (!target && user.getUsername().equalsIgnoreCase(props.getProtectedDefaultAdmin())) {
      throw new BusinessError("user.cannot-disable-default-admin");
    }

    if (user.isActive() == target) {
      log.info(
          "user.active-unchanged userId={} isActive={} actorUserId={}",
          userId,
          target,
          actorUserId);
      return;
    }

    userRepository.setActive(userId, target);
    log.info(
        "user.active-changed userId={} isActive={} actorUserId={}", userId, target, actorUserId);
  }

  // Soft-deleted users are unreachable from this API: {@code UserEntity.@SoftDelete} adds a
  // SQL restriction that filters them out of every JPA query, so {@code findById} returns empty
  // and the operation falls through to {@link ResourceNotFoundError}. That matches the rule
  // "no enable/disable of a soft-deleted user" without an extra branch here.

  // ---------- Helpers ----------

  /**
   * Appends the configured suffix to the slug supplied by the frontend and normalises the case.
   * Rejects slugs that already contain a {@code @} — the suffix is the backend's responsibility.
   */
  String composeUsername(String slug) {
    if (slug == null || slug.isBlank()) {
      throw new BusinessError("username.required");
    }
    if (slug.contains("@")) {
      throw new BusinessError("username.must-not-contain-at");
    }
    return (slug + props.getUsernameSuffix()).toLowerCase(Locale.ROOT);
  }
}
