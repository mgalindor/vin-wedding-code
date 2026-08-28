package com.vineyards.deerPlanner.invitation.domain;

/**
 * Distinct from the model-level {@code rsvp_status} on guests. The public invitation endpoint
 * normalises to a small fixed response vocabulary ({@link #thankYou} or {@link #failed}) — the
 * detailed per-guest status lives in the {@code guests} bounded context and is not surfaced.
 */
public record RsvpResponse(
    String status,
    String message
) {
    public static RsvpResponse thankYou() {
        return new RsvpResponse("thankYou", "Gracias por confirmar tu asistencia.");
    }

    public static RsvpResponse failed(String message) {
        return new RsvpResponse("failed", message);
    }
}
