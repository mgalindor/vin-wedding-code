package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;

public record GuestGroupChangedAuditedEvent(
    String eventId, String guestId, String oldGroupId, String newGroupId, Instant occurredAt) {}
