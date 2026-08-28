package com.vineyards.deerPlanner.guests.domain;

public enum GuestRelationship {
    family,
    friends,
    other;

    public static GuestRelationship fromString(String value) {
        if (value == null) {
            throw new IllegalArgumentException("relationship is required");
        }
        for (GuestRelationship r : values()) {
            if (r.name().equals(value)) {
                return r;
            }
        }
        throw new IllegalArgumentException("Unknown relationship: " + value);
    }
}
