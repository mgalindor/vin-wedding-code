package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/** {@code locations_payload}. Always wrapped at the root. */
public record LocationsPayloadDto(@NotNull @NotEmpty @Size(max = 8) List<@Valid Entry> entries) {
  public record Entry(
      @Size(max = 80) String label,
      @Size(max = 180) String name,
      @Size(max = 255) String address,
      @Size(max = 120) String city,
      @Size(max = 2048) String mapsLink,
      @Size(max = 5) String time,
      @Size(max = 255) String notes) {}
}
