package com.vineyards.deerPlanner.identity.facade;

import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.domain.User;

import java.time.OffsetDateTime;
import java.util.Set;

public record UserProfileResponse(
    String id,
    String username,
    String displayName,
    String email,
    Set<Role> roles,
    OffsetDateTime lastLoginAt
) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
            user.id(),
            user.username(),
            user.displayName(),
            user.email(),
            user.roles(),
            user.lastLoginAt()
        );
    }
}
