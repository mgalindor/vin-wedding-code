package com.vineyards.deerPlanner.events.domain;

/**
 * Thrown when an event lookup fails. Distinct from a generic 404 because the contract for an
 * event-id endpoint is well-defined: caller asked for an event by ID, event does not exist.
 */
public class EventNotFoundException extends RuntimeException {

    private final String eventId;

    public EventNotFoundException(String eventId) {
        super("Event not found: " + eventId);
        this.eventId = eventId;
    }

    public String eventId() {
        return eventId;
    }
}
