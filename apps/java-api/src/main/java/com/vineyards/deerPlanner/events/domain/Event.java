package com.vineyards.deerPlanner.events.domain;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Domain aggregate for any event type. The JSONB payloads (locations, program, contacts,
 * plus the wedding-specific landings) are kept as raw JSON strings. The application layer
 * passes them through unchanged; the adapter serialises/deserialises them and the inbound
 * layer parses them into typed DTOs. This keeps the entity free of JSON tooling.
 *
 * <p>For a wedding event, the partner names and wedding-only payloads are populated; for
 * other event types these fields are null. The discriminator is {@code eventType}.
 */
public record Event(
    String id,
    String organizerId,
    EventType eventType,
    String title,
    LocalDate eventDate,
    EventStatus status,
    String locationsPayload,
    String programPayload,
    String contactsPayload,
    WeddingDetail wedding,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    /**
     * Wedding-only detail row (1:1). Null for non-wedding events.
     */
    public record WeddingDetail(
        String partner1Name,
        String partner2Name,
        boolean countdownEnabled,
        String landingPayload,
        String storyPayload,
        String dressCodePayload,
        String giftRegistryPayload,
        String parentsPayload,
        String accommodationPayload
    ) {
        public WeddingDetail withLandingPayload(String json) {
            return new WeddingDetail(partner1Name, partner2Name, countdownEnabled,
                json, storyPayload, dressCodePayload, giftRegistryPayload, parentsPayload, accommodationPayload);
        }
        public WeddingDetail withStoryPayload(String json) {
            return new WeddingDetail(partner1Name, partner2Name, countdownEnabled,
                landingPayload, json, dressCodePayload, giftRegistryPayload, parentsPayload, accommodationPayload);
        }
        public WeddingDetail withDressCodePayload(String json) {
            return new WeddingDetail(partner1Name, partner2Name, countdownEnabled,
                landingPayload, storyPayload, json, giftRegistryPayload, parentsPayload, accommodationPayload);
        }
        public WeddingDetail withGiftRegistryPayload(String json) {
            return new WeddingDetail(partner1Name, partner2Name, countdownEnabled,
                landingPayload, storyPayload, dressCodePayload, json, parentsPayload, accommodationPayload);
        }
        public WeddingDetail withParentsPayload(String json) {
            return new WeddingDetail(partner1Name, partner2Name, countdownEnabled,
                landingPayload, storyPayload, dressCodePayload, giftRegistryPayload, json, accommodationPayload);
        }
        public WeddingDetail withAccommodationPayload(String json) {
            return new WeddingDetail(partner1Name, partner2Name, countdownEnabled,
                landingPayload, storyPayload, dressCodePayload, giftRegistryPayload, parentsPayload, json);
        }
    }

    public Event withStatus(EventStatus newStatus) {
        return new Event(id, organizerId, eventType, title, eventDate, newStatus,
            locationsPayload, programPayload, contactsPayload, wedding, createdAt, OffsetDateTime.now());
    }

    public Event withLocationsPayload(String json) {
        return new Event(id, organizerId, eventType, title, eventDate, status,
            json, programPayload, contactsPayload, wedding, createdAt, OffsetDateTime.now());
    }

    public Event withProgramPayload(String json) {
        return new Event(id, organizerId, eventType, title, eventDate, status,
            locationsPayload, json, contactsPayload, wedding, createdAt, OffsetDateTime.now());
    }

    public Event withContactsPayload(String json) {
        return new Event(id, organizerId, eventType, title, eventDate, status,
            locationsPayload, programPayload, json, wedding, createdAt, OffsetDateTime.now());
    }

    public Event withWedding(WeddingDetail w) {
        return new Event(id, organizerId, eventType, title, eventDate, status,
            locationsPayload, programPayload, contactsPayload, w, createdAt, OffsetDateTime.now());
    }
}
