package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Admin-only payload to reassign the organiser of an existing event. The {@code organizerId} must
 * point at an existing, active user (validated by the service via {@code
 * UserInPort.existsActiveUser}).
 */
public record ReassignOrganizerDto(
    @NotBlank(message = "organizerId is required")
        @Size(max = 20, message = "organizerId must be 20 characters or fewer")
        String organizerId) {}
