package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/**
 * {@code program_payload}. One day for single-day events, multiple
 * for multi-day.
 */
public record ProgramPayloadDto(
    @NotNull
    @Size(max = 7)
    List<@Valid Day> days
) {
    public record Day(
        LocalDate date,
        @Size(max = 80) String label,
        @NotNull
        @NotEmpty
        @Size(max = 24)
        List<@Valid Item> items
    ) {}

    public record Item(
        @NotNull @Size(max = 5) String time,
        @NotNull @Size(max = 180) String title,
        @Size(max = 255) String detail
    ) {}
}
