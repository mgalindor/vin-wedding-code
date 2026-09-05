package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;

public record GuestGroupRsvpMarkedAuditedEvent(
    String eventId, String groupId, String newStatus, int guestsAffected, Instant occurredAt) {}
