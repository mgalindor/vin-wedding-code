package com.vineyards.deerPlanner.events.domain.payload;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Structured JSONB type for accommodation_payload. Represents accommodation options for wedding
 * guests. Maps to {@link
 * com.vineyards.deerPlanner.events.facade.dto.WeddingAccommodationPayloadDto}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WeddingAccommodationPayload {

  private List<Entry> entries;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Entry {
    private String name;
    private String description;
    private String url;
    private String priceHint;
  }
}
