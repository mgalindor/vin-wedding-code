package com.vineyards.deerPlanner.guests.domain;

public class GuestNotFoundException extends RuntimeException {

    private final String guestId;

    public GuestNotFoundException(String guestId) {
        super("Guest not found: " + guestId);
        this.guestId = guestId;
    }

    public String guestId() {
        return guestId;
    }
}
