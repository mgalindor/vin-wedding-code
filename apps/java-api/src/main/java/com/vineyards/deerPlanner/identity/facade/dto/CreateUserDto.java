package com.vineyards.deerPlanner.identity.facade.dto;

import com.vineyards.deerPlanner.identity.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;

/**
 * Payload to create a new user. The {@code username} field carries the raw slug (no suffix); the
 * backend appends {@code deerplanner.identity.username-suffix} (default {@code @deer}) before
 * persisting.
 */
public record CreateUserDto(
    @NotBlank
        @Size(min = 1, max = 100)
        @Pattern(
            regexp = "^[A-Za-z0-9._-]+$",
            message = "username.must-be-alphanumeric-or-dot-or-dash")
        String username,
    @NotBlank @Size(max = 120) String displayName,
    @Email @Size(max = 254) String email,
    @Size(max = 32) String phone,
    @NotBlank @Size(min = 8, max = 72) String password,
    @NotEmpty Set<Role> roles) {}
