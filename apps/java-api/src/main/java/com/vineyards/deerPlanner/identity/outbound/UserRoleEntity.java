package com.vineyards.deerPlanner.identity.outbound;

import com.github.shamil.Xid;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_roles")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserRoleEntity {

  @EmbeddedId private UserRoleId id;

  @Column(name = "granted_at", nullable = false)
  private OffsetDateTime grantedAt;

  @PrePersist
  void onPersist() {
    if (id == null) {
      id = new UserRoleId();
    }
    if (id.getUserId() == null || id.getUserId().isBlank()) {
      id.setUserId(Xid.get().toString());
    }
    if (grantedAt == null) {
      grantedAt = OffsetDateTime.now();
    }
  }
}
