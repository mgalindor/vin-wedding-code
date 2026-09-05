package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;

public record GuestGroupDeletedAuditedEvent(
    String eventId, String groupId, int guestsRemoved, Instant occurredAt) {}
