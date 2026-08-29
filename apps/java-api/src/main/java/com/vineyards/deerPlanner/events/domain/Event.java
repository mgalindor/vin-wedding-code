package com.vineyards.deerPlanner.events.domain;

import com.vineyards.deerPlanner.events.domain.payload.ContactsPayload;
import com.vineyards.deerPlanner.events.domain.payload.LocationsPayload;
import com.vineyards.deerPlanner.events.domain.payload.ProgramPayload;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {
  private String id;
  private String organizerId;
  private EventType eventType;
  private String title;
  private LocalDate eventDate;
  private EventStatus status;
  private LocationsPayload locationsPayload;
  private ProgramPayload programPayload;
  private ContactsPayload contactsPayload;
  private WeddingDetail wedding;
  private OffsetDateTime createdAt;
  private OffsetDateTime updatedAt;
}
