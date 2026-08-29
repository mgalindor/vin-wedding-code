package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WeddingStoryPayloadDto(@NotBlank @Size(max = 4000) String body) {}
