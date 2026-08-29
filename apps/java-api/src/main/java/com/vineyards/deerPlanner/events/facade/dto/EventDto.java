package com.vineyards.deerPlanner.events.facade.dto;

import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EventDto(
    String id,
    String organizerId,
    EventType eventType,
    String title,
    LocalDate eventDate,
    EventStatus status,
    LocationsPayloadDto locations,
    ProgramPayloadDto program,
    ContactsPayloadDto contacts,
    WeddingPayloadsDto wedding,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt) {
  public record WeddingPayloadsDto(
      String partner1Name,
      String partner2Name,
      boolean countdownEnabled,
      WeddingLandingPayloadDto landing,
      WeddingStoryPayloadDto story,
      WeddingDressCodePayloadDto dressCode,
      WeddingGiftRegistryPayloadDto giftRegistry,
      WeddingParentsPayloadDto parents,
      WeddingAccommodationPayloadDto accommodation) {}

  public EventDto withLocations(LocationsPayloadDto locations) {
    return new EventDto(
        id,
        organizerId,
        eventType,
        title,
        eventDate,
        status,
        locations,
        program,
        contacts,
        wedding,
        createdAt,
        updatedAt);
  }

  public EventDto withProgram(ProgramPayloadDto program) {
    return new EventDto(
        id,
        organizerId,
        eventType,
        title,
        eventDate,
        status,
        locations,
        program,
        contacts,
        wedding,
        createdAt,
        updatedAt);
  }

  public EventDto withContacts(ContactsPayloadDto contacts) {
    return new EventDto(
        id,
        organizerId,
        eventType,
        title,
        eventDate,
        status,
        locations,
        program,
        contacts,
        wedding,
        createdAt,
        updatedAt);
  }

  public EventDto withWedding(WeddingPayloadsDto wedding) {
    return new EventDto(
        id,
        organizerId,
        eventType,
        title,
        eventDate,
        status,
        locations,
        program,
        contacts,
        wedding,
        createdAt,
        updatedAt);
  }
}
