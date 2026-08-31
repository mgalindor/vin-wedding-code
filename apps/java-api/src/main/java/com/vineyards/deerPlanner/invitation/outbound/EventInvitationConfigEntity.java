package com.vineyards.deerPlanner.invitation.outbound;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SoftDelete;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "event_invitation_config")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SoftDelete
public class EventInvitationConfigEntity {

  @Id private String eventId;

  private String templateId;

  @Column(name = "is_active")
  private boolean active = false;

  private Instant publishedAt;

  private LocalDate deadline;

  private boolean rsvpEnabled = true;

  private LocalDate rsvpDeadline;

  private String slug;

  @CreatedDate private Instant createdAt;

  @LastModifiedDate private Instant updatedAt;
}
