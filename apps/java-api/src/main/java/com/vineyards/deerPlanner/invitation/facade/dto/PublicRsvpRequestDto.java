package com.vineyards.deerPlanner.invitation.facade.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * MVP RSVP: a single binary response per invitation token (the family / group-level response).
 * Per-guest partial RSVP requires the {@code guests} module and is intentionally out of scope for
 * this controller — the public endpoint accepts only one of three normalised statuses.
 */
public record PublicRsvpRequestDto(@NotNull Response response, @Size(max = 500) String message) {

  public enum Response {
    confirmed_full,
    confirmed_partial,
    declined
  }
}
