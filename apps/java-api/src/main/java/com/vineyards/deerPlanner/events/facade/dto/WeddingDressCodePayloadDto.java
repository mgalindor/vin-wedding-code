package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record WeddingDressCodePayloadDto(
    @NotNull
    @NotEmpty
    List<@Valid Entry> entries
) {
    public record Entry(
        @NotNull @Size(max = 80) String title,
        @NotNull @Size(max = 1000) String body
    ) {}
}
