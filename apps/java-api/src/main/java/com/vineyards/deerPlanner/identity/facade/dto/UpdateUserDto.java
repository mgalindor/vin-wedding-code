package com.vineyards.deerPlanner.identity.facade.dto;

import com.vineyards.deerPlanner.identity.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import java.util.Set;

/**
 * Partial update payload. Any null field is left untouched. {@code roles} are only honoured when
 * the actor is an Administrator; otherwise the field is silently ignored (the API accepts it from
 * any caller but the service enforces the rule).
 */
public record UpdateUserDto(
    @Size(max = 120) String displayName,
    @Email @Size(max = 254) String email,
    @Size(max = 32) String phone,
    @Size(min = 8, max = 72) String password,
    Set<Role> roles) {}
