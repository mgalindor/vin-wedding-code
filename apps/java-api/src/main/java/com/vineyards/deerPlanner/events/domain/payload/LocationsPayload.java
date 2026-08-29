package com.vineyards.deerPlanner.events.domain.payload;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Structured JSONB type for locations_payload. Represents a list of event locations with details.
 * Maps to {@link com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LocationsPayload {

  private List<Entry> entries;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Entry {
    private String label;
    private String name;
    private String address;
    private String city;
    private String mapsLink;
    private String time;
    private String notes;
  }
}
