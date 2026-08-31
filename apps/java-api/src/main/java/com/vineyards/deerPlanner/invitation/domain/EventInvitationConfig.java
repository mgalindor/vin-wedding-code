package com.vineyards.deerPlanner.invitation.domain;

import java.time.Instant;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder(toBuilder = true)
public class EventInvitationConfig {
  private String eventId;
  private String templateId;
  private boolean active;
  private Instant publishedAt;
  private LocalDate deadline;
  private boolean rsvpEnabled;
  private LocalDate rsvpDeadline;
  private String slug;
  private Instant updatedAt;

  public EventInvitationConfig withTemplate(String templateId) {
    return toBuilder().templateId(templateId).build();
  }

  public EventInvitationConfig withActivation(boolean newActive) {
    return toBuilder().active(newActive).build();
  }

  public EventInvitationConfig withRsvpEnabled(boolean rsvpEnabled) {
    return toBuilder().rsvpEnabled(rsvpEnabled).build();
  }

  public EventInvitationConfig withSlug(String newSlug) {
    return toBuilder().slug(newSlug).build();
  }

  public EventInvitationConfig withDeadlines(LocalDate deadline, LocalDate rsvpDeadline) {
    return toBuilder().deadline(deadline).rsvpDeadline(rsvpDeadline).build();
  }

  public EventInvitationConfig withPublishedAt(Instant timestamp) {
    return toBuilder().active(true).publishedAt(timestamp).build();
  }
}
