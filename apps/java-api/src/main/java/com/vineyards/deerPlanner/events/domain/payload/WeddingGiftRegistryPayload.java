package com.vineyards.deerPlanner.events.domain.payload;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Structured JSONB type for gift_registry_payload. Represents gift registry links and notes for the
 * wedding. Maps to {@link
 * com.vineyards.deerPlanner.events.facade.dto.WeddingGiftRegistryPayloadDto}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WeddingGiftRegistryPayload {

  private List<Link> links;
  private String notes;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Link {
    private String label;
    private String url;
  }
}
