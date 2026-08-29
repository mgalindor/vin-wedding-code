package com.vineyards.deerPlanner.events.domain.payload;

import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Structured JSONB type for program_payload. Represents the event program across one or more days
 * with items/activities. Maps to {@link
 * com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProgramPayload {

  private List<Day> days;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Day {
    private LocalDate date;
    private String label;
    private List<Item> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
      private String time;
      private String title;
      private String detail;
    }
  }
}
