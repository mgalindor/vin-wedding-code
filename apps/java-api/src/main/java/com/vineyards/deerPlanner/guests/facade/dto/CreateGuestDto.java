package com.vineyards.deerPlanner.guests.facade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Body for {@code POST /api/v1/events/{eventId}/guests}.
 *
 * <p>{@code groupId} is nullable so a guest can be created without a group (it will then show up
 * under "Sin grupo" in the FE and can be assigned to a group later via PATCH /group). The DB schema
 * already supports this — see changelog {@code 006-guests-schema.yaml} (`group_id` is nullable by
 * design) and {@code 010-guests-add-fk-to-guest-groups.yaml} (the FK allows NULL).
 */
public record CreateGuestDto(
    String groupId,
    @NotBlank @Size(max = 240) String fullName,
    @Size(max = 254) String email,
    @Size(max = 32) String phone,
    @Size(max = 4000) String dietaryNotes) {}
