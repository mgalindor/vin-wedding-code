package com.vineyards.deerPlanner.guests.facade.dto;

import jakarta.validation.constraints.Size;

/**
 * Body for {@code PUT /api/v1/events/{eventId}/guest-groups/{groupId}/primary}. The {@code guestId}
 * points to a guest that must already belong to the group. Sending {@code null} (or omitting the
 * field) clears the {@code primaryGuestId} reference — useful when the organizer needs to
 * temporarily mark a group as "no primary assigned" before picking a new one.
 */
public record UpdateGuestGroupPrimaryDto(@Size(max = 20) String guestId) {}
