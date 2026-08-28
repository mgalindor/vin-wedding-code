package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.constraints.Size;

/**
 * {@code landing_payload} (target-data-model §4.1). The MVP only captures {@code preTitle}.
 */
public record WeddingLandingPayloadDto(
    @Size(max = 200) String preTitle
) {
}
