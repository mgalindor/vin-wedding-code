package com.vineyards.deerPlanner.guests.domain;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder(toBuilder = true)
public class Guest {
  private String id;
  private String groupId;
  private String firstName;
  private String lastName;
  private String email;
  private String phone;
  private String dietaryNotes;
  private String invitationToken;
  private RsvpStatus rsvpStatus;
  private Instant rsvpConfirmedAt;
  private String rsvpMessage;
  private String rsvpDietaryChoice;
  private Instant createdAt;
  private Instant updatedAt;

  public Guest withRsvpStatus(RsvpStatus status, Instant confirmedAt) {
    return toBuilder().rsvpStatus(status).rsvpConfirmedAt(confirmedAt).build();
  }
}
