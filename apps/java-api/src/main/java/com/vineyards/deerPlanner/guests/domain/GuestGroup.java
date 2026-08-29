package com.vineyards.deerPlanner.guests.domain;

import java.time.OffsetDateTime;
import java.util.Optional;
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
  private Optional<String> side;
  private GuestRelationship relationship;
  private Optional<String> sharedEmail;
  private Optional<String> sharedPhone;
  private Optional<String> primaryGuestId;
  private String invitationToken;
  private int displayOrder;
  private OffsetDateTime createdAt;
  private OffsetDateTime updatedAt;

  public GuestGroup withToken(String newToken) {
    return toBuilder().invitationToken(newToken).build();
  }

  public GuestGroup withPrimaryGuest(String primaryGuestId) {
    return toBuilder().primaryGuestId(Optional.ofNullable(primaryGuestId)).build();
  }
}
