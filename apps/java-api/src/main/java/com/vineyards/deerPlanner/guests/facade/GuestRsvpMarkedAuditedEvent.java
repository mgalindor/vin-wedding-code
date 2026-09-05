package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;

public record GuestRsvpMarkedAuditedEvent(
    String eventId, String guestId, String newStatus, Instant occurredAt) {}
