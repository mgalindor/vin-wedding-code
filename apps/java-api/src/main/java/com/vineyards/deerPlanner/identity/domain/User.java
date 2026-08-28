package com.vineyards.deerPlanner.identity.domain;

import java.time.OffsetDateTime;
import java.util.Set;

public record User(
    String id,
    String username,
    String displayName,
    String email,
    String phone,
    String passwordHash,
    boolean isActive,
    OffsetDateTime lastLoginAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    Set<Role> roles
) {

    public User {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("User.id must not be blank");
        }
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("User.username must not be blank");
        }
        if (displayName == null || displayName.isBlank()) {
            throw new IllegalArgumentException("User.displayName must not be blank");
        }
        if (passwordHash == null || passwordHash.isBlank()) {
            throw new IllegalArgumentException("User.passwordHash must not be blank");
        }
        if (roles == null || roles.isEmpty()) {
            throw new IllegalArgumentException("User.roles must contain at least one role");
        }
        roles = Set.copyOf(roles);
    }

    public boolean isAdministrator() {
        return roles.contains(Role.Administrator);
    }

    public boolean isEventOrganizer() {
        return roles.contains(Role.EventOrganizer);
    }
}
