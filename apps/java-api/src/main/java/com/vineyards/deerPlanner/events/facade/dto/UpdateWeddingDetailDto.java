package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.constraints.Size;

/**
 * Top-level wedding detail (couple names + countdown flag) for partial updates. Anything null is
 * left untouched — same semantics as {@link UpdateEventDto}. The 6 JSONB payloads each get their
 * own {@code PUT /events/{id}/wedding-*} endpoint and DTO.
 */
public record UpdateWeddingDetailDto(
    @Size(max = 180) String partner1Name,
    @Size(max = 180) String partner2Name,
    Boolean countdownEnabled) {}
