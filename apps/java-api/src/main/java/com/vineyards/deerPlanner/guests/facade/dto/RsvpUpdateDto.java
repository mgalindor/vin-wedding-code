package com.vineyards.deerPlanner.guests.facade.dto;

import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Body for the admin RSVP endpoints. {@code status} is required; {@code message} is optional and
 * applies to the guest (or every guest in the group when the group-level endpoint is used).
 *
 * <p>Sending {@code status = "pending"} resets the RSVP and clears {@code rsvpConfirmedAt} — that
 * is the way an organizer undoes a previous confirmation.
 */
public record RsvpUpdateDto(@NotNull RsvpStatus status, @Size(max = 500) String message) {}
