package com.vineyards.deerPlanner.invitation.domain;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * Aggregate for the per-event invitation configuration. 1:1 with {@code events} via the
 * shared {@code eventId} primary key. The {@code slug} doubles as the public-access
 * token (used by the public invitation endpoint).
 */
public record EventInvitationConfig(
    String eventId,
    String templateId,
    boolean active,
    Optional<OffsetDateTime> publishedAt,
    Optional<LocalDate> deadline,
    boolean rsvpEnabled,
    Optional<LocalDate> rsvpDeadline,
    String slug,
    OffsetDateTime updatedAt
) {
    public EventInvitationConfig withTemplate(String templateId) {
        return new EventInvitationConfig(eventId, templateId, active, publishedAt, deadline,
            rsvpEnabled, rsvpDeadline, slug, OffsetDateTime.now());
    }

    public EventInvitationConfig withActivation(boolean newActive) {
        return new EventInvitationConfig(eventId, templateId, newActive, publishedAt, deadline,
            rsvpEnabled, rsvpDeadline, slug, OffsetDateTime.now());
    }

    public EventInvitationConfig withRsvpEnabled(boolean rsvpEnabled) {
        return new EventInvitationConfig(eventId, templateId, active, publishedAt, deadline,
            rsvpEnabled, rsvpDeadline, slug, OffsetDateTime.now());
    }

    public EventInvitationConfig withSlug(String newSlug) {
        return new EventInvitationConfig(eventId, templateId, active, publishedAt, deadline,
            rsvpEnabled, rsvpDeadline, newSlug, OffsetDateTime.now());
    }

    public EventInvitationConfig withDeadlines(LocalDate deadline, LocalDate rsvpDeadline) {
        return new EventInvitationConfig(eventId, templateId, active, publishedAt,
            Optional.ofNullable(deadline), rsvpEnabled,
            Optional.ofNullable(rsvpDeadline), slug, OffsetDateTime.now());
    }

    public EventInvitationConfig withPublishedAt(OffsetDateTime timestamp) {
        return new EventInvitationConfig(eventId, templateId, true,
            Optional.ofNullable(timestamp), deadline, rsvpEnabled, rsvpDeadline, slug,
            OffsetDateTime.now());
    }
}
