package com.vineyards.deerPlanner.events.domain.payload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Structured JSONB type for landing_payload. Represents the landing page configuration for a
 * wedding event. Maps to {@link
 * com.vineyards.deerPlanner.events.facade.dto.WeddingLandingPayloadDto}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WeddingLandingPayload {

  private String preTitle;
}
