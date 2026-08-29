package com.vineyards.deerPlanner.events.facade.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ContactsPayloadDto(@NotNull @NotEmpty @Size(max = 10) List<@Valid Entry> entries) {
  public record Entry(
      @NotNull @Size(max = 80) String label,
      @NotNull @Size(max = 180) String fullName,
      @Size(max = 32) String phone,
      @Email @Size(max = 254) String email) {}
}
