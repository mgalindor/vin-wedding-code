package com.vineyards.deerPlanner.identity.facade.dto;

import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.domain.User;
import java.time.Instant;
import java.util.Set;

/** Read-only projection of a user row. Never carries the password hash. */
public record UserResponse(
    String id,
    String username,
    String displayName,
    String email,
    String phone,
    boolean isActive,
    Set<Role> roles,
    Instant lastLoginAt,
    Instant createdAt,
    Instant updatedAt) {
  public static UserResponse from(User user) {
    return new UserResponse(
        user.getId(),
        user.getUsername(),
        user.getDisplayName(),
        user.getEmail(),
        user.getPhone(),
        user.isActive(),
        user.getRoles(),
        user.getLastLoginAt(),
        user.getCreatedAt(),
        user.getUpdatedAt());
  }
}
