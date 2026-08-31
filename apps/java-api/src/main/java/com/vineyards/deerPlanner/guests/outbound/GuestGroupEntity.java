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
@Table(name = "guest_groups")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SoftDelete
public class GuestGroupEntity {

  @Id @XidId private String id;

  private String eventId;

  private String name;

  private String relationship;

  private String sharedEmail;

  private String sharedPhone;

  private String primaryGuestId;

  private String invitationToken;

  private int displayOrder = 0;

  @CreatedDate private Instant createdAt;

  @LastModifiedDate private Instant updatedAt;
}
