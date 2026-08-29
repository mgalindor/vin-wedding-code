package com.vineyards.deerPlanner.invitation.domain;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;
import lombok.Builder;
import lombok.Data;

@Data
@Builder(toBuilder = true)
public class EventInvitationConfig {
  private String eventId;
  private String templateId;
  private boolean active;
  private Optional<OffsetDateTime> publishedAt;
  private Optional<LocalDate> deadline;
  private boolean rsvpEnabled;
  private Optional<LocalDate> rsvpDeadline;
  private String slug;
  private OffsetDateTime updatedAt;

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
    return toBuilder()
        .deadline(Optional.ofNullable(deadline))
        .rsvpDeadline(Optional.ofNullable(rsvpDeadline))
        .build();
  }

  public EventInvitationConfig withPublishedAt(OffsetDateTime timestamp) {
    return toBuilder().active(true).publishedAt(Optional.ofNullable(timestamp)).build();
  }
}
