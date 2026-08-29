package com.vineyards.deerPlanner.events.facade.dto;

import com.vineyards.deerPlanner.events.domain.EventType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateEventDto(
    @NotBlank @Size(max = 180) String title,
    @NotNull EventType eventType,
    @NotNull @Future LocalDate eventDate,
    @Size(max = 180) String templateId,
    @Size(max = 180) String partner1Name,
    @Size(max = 180) String partner2Name,
    @Size(max = 80) String honoreeName,
    Integer ageTurning,
    Integer yearsCelebrating) {}
