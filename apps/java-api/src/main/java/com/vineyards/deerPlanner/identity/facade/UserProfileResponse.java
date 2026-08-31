package com.vineyards.deerPlanner.identity.facade;

import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.domain.User;
import java.time.Instant;
import java.util.Set;

public record UserProfileResponse(
    String id,
    String username,
    String displayName,
    String email,
    Set<Role> roles,
    Instant lastLoginAt) {
  public static UserProfileResponse from(User user) {
    return new UserProfileResponse(
        user.getId(),
        user.getUsername(),
        user.getDisplayName(),
        user.getEmail(),
        user.getRoles(),
        user.getLastLoginAt());
  }
}
