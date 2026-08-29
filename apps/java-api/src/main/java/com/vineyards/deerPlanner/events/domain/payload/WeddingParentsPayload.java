package com.vineyards.deerPlanner.events.domain.payload;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Structured JSONB type for parents_payload. Represents parents/family information for the wedding.
 * Maps to {@link com.vineyards.deerPlanner.events.facade.dto.WeddingParentsPayloadDto}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WeddingParentsPayload {

  private String partner1Label;
  private List<String> partner1Names;
  private String partner2Label;
  private List<String> partner2Names;
}
