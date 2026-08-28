package com.vineyards.deerPlanner.guests.domain;

public enum RsvpStatus {
    pending,
    confirmed,
    declined;

    public static RsvpStatus fromString(String value) {
        if (value == null) {
            return pending;
        }
        for (RsvpStatus s : values()) {
            if (s.name().equals(value)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown RSVP status: " + value);
    }
}
