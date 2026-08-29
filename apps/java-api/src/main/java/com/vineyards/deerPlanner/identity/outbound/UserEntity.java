package com.vineyards.deerPlanner.identity.outbound;

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
@Table(name = "users")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserEntity {

  @Id
  @Column(name = "id", nullable = false, length = 20)
  private String id;

  @Column(name = "username", nullable = false, length = 120, unique = true)
  private String username;

  @Column(name = "display_name", nullable = false, length = 120)
  private String displayName;

  @Column(name = "email", length = 254)
  private String email;

  @Column(name = "phone", length = 32)
  private String phone;

  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Column(name = "is_active", nullable = false)
  private boolean isActive = true;

  @Column(name = "last_login_at")
  private OffsetDateTime lastLoginAt;

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
