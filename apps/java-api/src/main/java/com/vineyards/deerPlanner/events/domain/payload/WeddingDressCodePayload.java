package com.vineyards.deerPlanner.events.domain.payload;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Structured JSONB type for dress_code_payload. Represents the dress code entries for a wedding
 * event. Maps to {@link com.vineyards.deerPlanner.events.facade.dto.WeddingDressCodePayloadDto}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WeddingDressCodePayload {

  private List<Entry> entries;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Entry {
    private String title;
    private String body;
  }
}
