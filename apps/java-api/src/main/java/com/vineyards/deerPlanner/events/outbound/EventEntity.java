package com.vineyards.deerPlanner.events.outbound;

import com.github.shamil.Xid;
import com.vineyards.deerPlanner.events.domain.payload.ContactsPayload;
import com.vineyards.deerPlanner.events.domain.payload.LocationsPayload;
import com.vineyards.deerPlanner.events.domain.payload.ProgramPayload;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "events")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EventEntity {

  @Id
  @Column(name = "id", nullable = false, length = 20)
  private String id;

  @Column(name = "organizer_id", nullable = false, length = 20)
  private String organizerId;

  @Column(name = "event_type", nullable = false, length = 20)
  private String eventType;

  @Column(name = "title", nullable = false, length = 180)
  private String title;

  @Column(name = "event_date", nullable = false)
  private LocalDate eventDate;

  @Column(name = "status", nullable = false, length = 20)
  private String status;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "locations_payload")
  private LocationsPayload locationsPayload;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "program_payload")
  private ProgramPayload programPayload;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "contacts_payload")
  private ContactsPayload contactsPayload;

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
