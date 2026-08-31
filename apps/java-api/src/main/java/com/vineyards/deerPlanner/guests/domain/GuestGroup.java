package com.vineyards.deerPlanner.guests.domain;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class GuestGroup {
  private String id;
  private String eventId;
  private String name;
  private GuestRelationship relationship;
  private String sharedEmail;
  private String sharedPhone;
  private String primaryGuestId;
  private String invitationToken;
  private int displayOrder;
  private Instant createdAt;
  private Instant updatedAt;

  public GuestGroup withToken(String newToken) {
    return toBuilder().invitationToken(newToken).build();
  }

  public GuestGroup withPrimaryGuest(String primaryGuestId) {
    return toBuilder().primaryGuestId(primaryGuestId).build();
  }
}
