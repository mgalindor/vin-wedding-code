package com.vineyards.deerPlanner.invitation.outbound;

import com.github.shamil.Xid;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "event_invitation_config")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EventInvitationConfigEntity {

  @Id
  @Column(name = "event_id", nullable = false, length = 20)
  private String eventId;

  @Column(name = "template_id", length = 30)
  private String templateId;

  @Column(name = "is_active", nullable = false)
  private boolean active = false;

  @Column(name = "published_at")
  private OffsetDateTime publishedAt;

  @Column(name = "deadline")
  private LocalDate deadline;

  @Column(name = "rsvp_enabled", nullable = false)
  private boolean rsvpEnabled = true;

  @Column(name = "rsvp_deadline")
  private LocalDate rsvpDeadline;

  @Column(name = "slug", nullable = false, length = 80, unique = true)
  private String slug;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @PrePersist
  void onPersist() {
    // The PK is the eventId — already set by the caller (the event was created
    // first). If somehow null, generate one to satisfy the NOT NULL constraint.
    if (eventId == null || eventId.isBlank()) {
      eventId = Xid.get().toString();
    }
    if (updatedAt == null) {
      updatedAt = OffsetDateTime.now();
    }
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = OffsetDateTime.now();
  }
}
