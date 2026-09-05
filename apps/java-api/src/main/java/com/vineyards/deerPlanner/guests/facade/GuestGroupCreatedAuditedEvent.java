package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;

public record GuestGroupCreatedAuditedEvent(
    String eventId, String groupId, int guestsAdded, String primaryGuestId, Instant occurredAt) {}
