package com.vineyards.deerPlanner.invitation.outbound;

import com.github.shamil.Xid;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "invitation_templates")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class InvitationTemplateEntity {

  @Id
  @Column(name = "id", nullable = false, length = 20)
  private String id;

  @Column(name = "code", nullable = false, length = 64, unique = true)
  private String code;

  @Column(name = "event_type", nullable = false, length = 20)
  private String eventType;

  @Column(name = "name", nullable = false, length = 120)
  private String name;

  @Column(name = "description", length = 255)
  private String description;

  @Column(name = "is_active", nullable = false)
  private boolean active = true;

  @Column(name = "display_order", nullable = false)
  private int displayOrder = 0;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @PrePersist
  void onPersist() {
    if (id == null || id.isBlank()) {
      id = Xid.get().toString();
    }
    OffsetDateTime now = OffsetDateTime.now();
    if (createdAt == null) {
      createdAt = now;
    }
    updatedAt = now;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = OffsetDateTime.now();
  }
}
