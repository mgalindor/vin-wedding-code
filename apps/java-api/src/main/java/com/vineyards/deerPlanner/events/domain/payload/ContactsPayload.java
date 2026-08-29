package com.vineyards.deerPlanner.events.domain.payload;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Structured JSONB type for contacts_payload. Represents a list of event contacts with
 * communication details. Maps to {@link
 * com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ContactsPayload {

  private List<Entry> entries;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Entry {
    private String label;
    private String fullName;
    private String phone;
    private String email;
  }
}
