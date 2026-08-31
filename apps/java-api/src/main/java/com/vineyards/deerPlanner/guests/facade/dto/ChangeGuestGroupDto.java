package com.vineyards.deerPlanner.guests.facade.dto;

import jakarta.validation.constraints.Size;

/**
 * Body for {@code PATCH /api/v1/events/{eventId}/guests/{guestId}/group}.
 *
 * <p>{@code groupId} is optional. When omitted or explicitly {@code null}, the guest is unassigned
 * from its current group. When supplied, the guest is moved into the target group.
 */
public record ChangeGuestGroupDto(@Size(max = 20) String groupId) {}
