package com.vineyards.deerPlanner.identity.outbound;

import com.vineyards.deerPlanner.identity.application.port.UserRepository;
import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
@SecondaryAdapter
@RequiredArgsConstructor
@Slf4j
public class UserRepositoryAdapter implements UserRepository {

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
    public void recordLogin(String userId) {
        userJpa.recordLogin(userId, OffsetDateTime.now());
    }

    private User toDomain(UserEntity entity) {
        Set<Role> roles = parseRoles(userRoleJpa.findByUserId(entity.getId()));
        return new User(
            entity.getId(),
            entity.getUsername(),
            entity.getDisplayName(),
            entity.getEmail(),
            entity.getPhone(),
            entity.getPasswordHash(),
            entity.isActive(),
            entity.getLastLoginAt(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            roles
        );
    }

    private static Set<Role> parseRoles(List<UserRoleEntity> rows) {
        if (rows.isEmpty()) {
            // Empty role set is rejected by the User invariant; surface the data-corruption case.
            return EnumSet.noneOf(Role.class);
        }
        EnumSet<Role> result = EnumSet.noneOf(Role.class);
        for (UserRoleEntity row : rows) {
            Role mapped = mapRole(row.getRole());
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
