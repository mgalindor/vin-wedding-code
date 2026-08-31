package com.vineyards.deerPlanner.guests.outbound;

import com.vineyards.deerPlanner.shared.persistence.XidId;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SoftDelete;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "guests")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SoftDelete
public class GuestEntity {

  @Id @XidId private String id;

  private String groupId;

  private String firstName;

  private String lastName;

  private String email;

  private String phone;

  private String dietaryNotes;

  private boolean primary = false;

  private String invitationToken;

  private String rsvpStatus = "pending";

  private Instant rsvpConfirmedAt;

  private String rsvpMessage;

  private String rsvpDietaryChoice;

  @CreatedDate private Instant createdAt;

  @LastModifiedDate private Instant updatedAt;
}
