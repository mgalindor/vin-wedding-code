package com.vineyards.deerPlanner.events.outbound;

import com.vineyards.deerPlanner.events.domain.payload.ContactsPayload;
import com.vineyards.deerPlanner.events.domain.payload.LocationsPayload;
import com.vineyards.deerPlanner.events.domain.payload.ProgramPayload;
import com.vineyards.deerPlanner.shared.persistence.XidId;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SoftDelete;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "events")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@SoftDelete
public class EventEntity {

  @Id @XidId private String id;

  private String organizerId;

  private String eventType;

  private String title;

  private LocalDate eventDate;

  private String status;

  @JdbcTypeCode(SqlTypes.JSON)
  private LocationsPayload locationsPayload;

  @JdbcTypeCode(SqlTypes.JSON)
  private ProgramPayload programPayload;

  @JdbcTypeCode(SqlTypes.JSON)
  private ContactsPayload contactsPayload;

  @CreatedDate private Instant createdAt;

  @LastModifiedDate private Instant updatedAt;
}
