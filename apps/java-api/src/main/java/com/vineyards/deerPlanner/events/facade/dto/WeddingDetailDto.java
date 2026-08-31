package com.vineyards.deerPlanner.events.facade.dto;

/**
 * Aggregate view of an event's wedding-specific state. Returned by GET and by every PUT under
 * {@code /events/{id}/wedding-*}. The 6 nested payloads match the JSONB columns of the {@code
 * wedding_events} table 1:1; {@code landingPayload} etc. are null until the organizer configures
 * them. No {@code updatedAt} here because the {@code wedding_events} table intentionally does not
 * carry timestamps — the row exists or it doesn't.
 */
public record WeddingDetailDto(
    String eventId,
    String partner1Name,
    String partner2Name,
    boolean countdownEnabled,
    WeddingLandingPayloadDto landing,
    WeddingStoryPayloadDto story,
    WeddingDressCodePayloadDto dressCode,
    WeddingGiftRegistryPayloadDto giftRegistry,
    WeddingParentsPayloadDto parents,
    WeddingAccommodationPayloadDto accommodation) {}
