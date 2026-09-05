package com.vineyards.deerPlanner.invitation.outbound;

import com.vineyards.deerPlanner.shared.persistence.XidId;
import jakarta.persistence.Column;
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
@Table(name = "invitation_templates")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SoftDelete
public class InvitationTemplateEntity {

  @Id @XidId private String id;

  private String code;

  private String eventType;

  private String name;

  private String description;

  @Column(name = "is_active")
  private boolean active = true;

  private int displayOrder = 0;

  @CreatedDate private Instant createdAt;

  @LastModifiedDate private Instant updatedAt;
}
