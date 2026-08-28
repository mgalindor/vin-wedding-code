package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public record WeddingAccommodationPayloadDto(
    @Size(max = 6)
    List<@Valid Entry> entries
) {
    public record Entry(
        @Size(max = 120) String name,
        @Size(max = 300) String description,
        @Size(max = 2048) String url,
        @Size(max = 80) String priceHint
    ) {}
}
