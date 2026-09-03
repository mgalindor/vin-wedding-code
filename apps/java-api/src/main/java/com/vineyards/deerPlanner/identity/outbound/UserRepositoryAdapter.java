package com.vineyards.deerPlanner.identity.outbound;

import com.vineyards.deerPlanner.identity.application.port.UserOutPort;
import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.domain.User;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@SecondaryAdapter
@RequiredArgsConstructor
@Slf4j
public class UserRepositoryAdapter implements UserOutPort {

  private final UserJpaRepository userJpa;
  private final UserRoleJpaRepository userRoleJpa;

  @Override
  public Optional<User> findByUsername(String username) {
    return userJpa.findByUsername(username).map(this::toDomain);
  }

  @Override
  public Optional<User> findActiveById(String id) {
    return userJpa.findActiveById(id).map(this::toDomain);
  }

  @Override
  public Optional<User> findById(String id) {
    return userJpa.findById(id).map(this::toDomain);
  }

  @Override
  public void recordLogin(String userId) {
    userJpa.recordLogin(userId, Instant.now());
  }

  @Override
  @Transactional
  public User create(User user) {
    UserEntity entity = toEntity(user);
    UserEntity saved = userJpa.save(entity);
    // Flush so the generated id is materialised before we build the role rows that FK into it.
    userJpa.flush();
    Instant grantedAt = Instant.now();
    for (Role role : user.getRoles()) {
      UserRoleEntity roleEntity =
          new UserRoleEntity(new UserRoleId(saved.getId(), role.name()), grantedAt);
      userRoleJpa.save(roleEntity);
    }
    userJpa.flush();
    log.info(
        "user.created userId={} username={} roles={}",
        saved.getId(),
        user.getUsername(),
        user.getRoles());
    return findByUsername(user.getUsername())
        .orElseThrow(
            () ->
                new IllegalStateException(
                    "user.created.not-found-after-insert username=" + user.getUsername()));
  }

  @Override
  @Transactional
  public User update(User user) {
    UserEntity existing =
        userJpa
            .findById(user.getId())
            .orElseThrow(
                () -> new IllegalStateException("user.update.not-found id=" + user.getId()));
    existing.setDisplayName(user.getDisplayName());
    existing.setEmail(user.getEmail());
    existing.setPhone(user.getPhone());
    if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
      existing.setPasswordHash(user.getPasswordHash());
    }
    UserEntity saved = userJpa.save(existing);

    // Roles are a full replacement — the API takes a Set, not a delta. Bulk delete via
    // @Modifying @Query runs the DELETE in its own statement, so the subsequent INSERT batch
    // can't trip the unique constraint on (user_id, role) when the new set overlaps the old.
    userRoleJpa.deleteAllRolesForUser(saved.getId());
    Instant grantedAt = Instant.now();
    for (Role role : user.getRoles()) {
      UserRoleEntity roleEntity =
          new UserRoleEntity(new UserRoleId(saved.getId(), role.name()), grantedAt);
      userRoleJpa.save(roleEntity);
    }
    userRoleJpa.flush();

    log.info(
        "user.updated userId={} username={} roles={}",
        saved.getId(),
        saved.getUsername(),
        user.getRoles());
    return findById(saved.getId())
        .orElseThrow(
            () ->
                new IllegalStateException("user.update.not-found-after-save id=" + saved.getId()));
  }

  @Override
  @Transactional
  public void setActive(String id, boolean active) {
    int rows = userJpa.setActive(id, active);
    log.info("user.active-changed userId={} isActive={} matched={}", id, active, rows > 0);
  }

  @Override
  @Transactional
  public void updatePassword(String id, String passwordHash) {
    int rows = userJpa.updatePassword(id, passwordHash);
    log.info("user.password-changed userId={} matched={}", id, rows > 0);
  }

  @Override
  @Transactional
  public void delete(String id) {
    // Hibernate @SoftDelete translates this into an UPDATE setting deleted=true; the user
    // disappears from every subsequent JPA query via the @SQLRestriction filter.
    userJpa.deleteById(id);
    log.info("user.deleted userId={}", id);
  }

  @Override
  public boolean existsActiveById(String id) {
    return userJpa.findActiveById(id).isPresent();
  }

  @Override
  public org.springframework.data.domain.Page<User> search(
      org.springframework.data.jpa.domain.Specification<UserEntity> spec,
      org.springframework.data.domain.Pageable pageable) {
    return userJpa.findAll(spec, pageable).map(this::toDomain);
  }

  private UserEntity toEntity(User user) {
    UserEntity entity = new UserEntity();
    entity.setUsername(user.getUsername());
    entity.setDisplayName(user.getDisplayName());
    entity.setEmail(user.getEmail());
    entity.setPhone(user.getPhone());
    entity.setPasswordHash(user.getPasswordHash());
    entity.setActive(user.isActive());
    return entity;
  }

  private User toDomain(UserEntity entity) {
    Set<Role> roles = parseRoles(userRoleJpa.findByIdUserId(entity.getId()));
    return User.builder()
        .id(entity.getId())
        .username(entity.getUsername())
        .displayName(entity.getDisplayName())
        .email(entity.getEmail())
        .phone(entity.getPhone())
        .passwordHash(entity.getPasswordHash())
        .isActive(entity.isActive())
        .lastLoginAt(entity.getLastLoginAt())
        .createdAt(entity.getCreatedAt())
        .updatedAt(entity.getUpdatedAt())
        .roles(roles)
        .build();
  }

  private static Set<Role> parseRoles(List<UserRoleEntity> rows) {
    if (rows.isEmpty()) {
      // Empty role set is rejected by the User invariant; surface the data-corruption case.
      return EnumSet.noneOf(Role.class);
    }
    EnumSet<Role> result = EnumSet.noneOf(Role.class);
    for (UserRoleEntity row : rows) {
      Role mapped = mapRole(row.getId().getRole());
      if (mapped != null) {
        result.add(mapped);
      }
    }
    return result;
  }

  private static Role mapRole(String dbValue) {
    if (dbValue == null) {
      return null;
    }
    try {
      return Role.valueOf(dbValue);
    } catch (IllegalArgumentException ex) {
      // Defensive: the DB check constraint should prevent this, but if a future migration
      // introduces a new role value the application should not crash.
      return null;
    }
  }
}
