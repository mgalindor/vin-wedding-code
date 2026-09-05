package com.vineyards.deerPlanner.guests.facade;

import java.time.Instant;

public record GuestGroupPrimaryUpdatedAuditedEvent(
    String eventId, String groupId, String oldPrimaryId, String newPrimaryId, Instant occurredAt) {}
