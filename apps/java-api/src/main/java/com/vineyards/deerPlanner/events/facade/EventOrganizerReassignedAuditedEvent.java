package com.vineyards.deerPlanner.events.facade;

import java.time.Instant;

public record EventOrganizerReassignedAuditedEvent(
    String eventId, String oldOrganizerId, String newOrganizerId, Instant occurredAt) {}
