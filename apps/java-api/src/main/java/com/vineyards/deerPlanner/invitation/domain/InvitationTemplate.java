package com.vineyards.deerPlanner.invitation.domain;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder(toBuilder = true)
public class InvitationTemplate {
  private String id;
  private String code;
  private String eventType;
  private String name;
  private String description;
  private boolean active;
  private int displayOrder;
  private OffsetDateTime createdAt;
  private OffsetDateTime updatedAt;
}
