package com.vineyards.deerPlanner.invitation.facade.dto;

import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Body for the public group RSVP endpoint. The primary contact picks which guests attend and which
 * don't. {@code guests} contains one entry per guest the primary is updating in this submission —
 * guests not mentioned keep their previous RSVP status.
 */
public record PublicGroupRsvpRequestDto(
    @Size(max = 500) String message, @NotNull @Size(max = 100) List<@Valid Entry> guests) {

  public record Entry(@NotNull String guestId, @NotNull RsvpStatus status) {}
}
