package com.vineyards.deerPlanner.events.domain.payload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Structured JSONB type for story_payload. Represents the couple's story/narrative for the wedding.
 * Maps to {@link com.vineyards.deerPlanner.events.facade.dto.WeddingStoryPayloadDto}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WeddingStoryPayload {

  private String body;
}
