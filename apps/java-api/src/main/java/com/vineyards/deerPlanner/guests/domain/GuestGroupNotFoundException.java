package com.vineyards.deerPlanner.guests.domain;

public class GuestGroupNotFoundException extends RuntimeException {

    private final String groupId;

    public GuestGroupNotFoundException(String groupId) {
        super("Guest group not found: " + groupId);
        this.groupId = groupId;
    }

    public String groupId() {
        return groupId;
    }
}
