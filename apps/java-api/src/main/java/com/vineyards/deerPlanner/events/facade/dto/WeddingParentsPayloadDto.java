package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.constraints.Size;
import java.util.List;

public record WeddingParentsPayloadDto(
    @Size(max = 60) String partner1Label,
    @Size(max = 6) List<String> partner1Names,
    @Size(max = 60) String partner2Label,
    @Size(max = 6) List<String> partner2Names) {}
