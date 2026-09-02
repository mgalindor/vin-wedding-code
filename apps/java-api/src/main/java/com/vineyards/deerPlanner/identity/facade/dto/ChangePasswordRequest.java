package com.vineyards.deerPlanner.identity.facade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Self-service password change. The caller must present the current password (verified against the
 * stored bcrypt hash) before the new password is accepted. Admin-driven password resets go through
 * {@code PATCH /api/v1/users/{id}} with the {@code password} field instead.
 */
public record ChangePasswordRequest(
    @NotBlank @Size(min = 8, max = 72) String currentPassword,
    @NotBlank @Size(min = 8, max = 72) String newPassword) {}
