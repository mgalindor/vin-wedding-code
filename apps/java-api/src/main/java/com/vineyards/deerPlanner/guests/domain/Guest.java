package com.vineyards.deerPlanner.guests.domain;

import java.time.OffsetDateTime;
import java.util.Optional;
import lombok.Builder;
import lombok.Data;

@Data
@Builder(toBuilder = true)
public class Guest {
  private String id;
  private String groupId;
  private String firstName;
  private String lastName;
  private Optional<String> email;
  private Optional<String> phone;
  private Optional<String> dietaryNotes;
  private boolean primary;
  private String invitationToken;
  private RsvpStatus rsvpStatus;
  private Optional<OffsetDateTime> rsvpConfirmedAt;
  private Optional<String> rsvpMessage;
  private Optional<String> rsvpDietaryChoice;
  private OffsetDateTime createdAt;
  private OffsetDateTime updatedAt;

  public Guest withRsvpStatus(RsvpStatus status, OffsetDateTime confirmedAt) {
    return toBuilder().rsvpStatus(status).rsvpConfirmedAt(Optional.ofNullable(confirmedAt)).build();
  }
}
