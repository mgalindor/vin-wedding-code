package com.vineyards.deerPlanner.identity.outbound;

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
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SoftDelete
public class UserEntity {

  @Id @XidId private String id;

  private String username;

  private String displayName;

  private String email;

  private String phone;

  private String passwordHash;

  private boolean isActive = true;

  private Instant lastLoginAt;

  @CreatedDate private Instant createdAt;

  @LastModifiedDate private Instant updatedAt;
}
