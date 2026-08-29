package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;

public record WeddingGiftRegistryPayloadDto(
    @Size(max = 8) List<@Valid Link> links, @Size(max = 2000) String notes) {
  public record Link(@Size(max = 60) String label, @Size(max = 2048) String url) {}
}
