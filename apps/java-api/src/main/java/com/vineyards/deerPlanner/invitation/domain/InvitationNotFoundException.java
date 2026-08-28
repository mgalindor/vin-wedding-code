package com.vineyards.deerPlanner.invitation.domain;

public class InvitationNotFoundException extends RuntimeException {

    private final String slug;

    public InvitationNotFoundException(String slug) {
        super("Invitation not found: " + slug);
        this.slug = slug;
    }

    public String slug() {
        return slug;
    }
}
