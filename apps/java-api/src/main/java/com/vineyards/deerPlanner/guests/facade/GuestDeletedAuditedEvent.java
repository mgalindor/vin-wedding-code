package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;

public record GuestDeletedAuditedEvent(String eventId, String guestId, Instant occurredAt) {}
