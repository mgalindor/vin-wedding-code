package com.vineyards.deerPlanner.identity.outbound;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "user_roles")
@IdClass(UserRoleEntity.UserRoleId.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserRoleEntity {

    @Id
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Id
    @Column(name = "role", nullable = false, length = 40)
    private String role;

    @Column(name = "granted_at", nullable = false)
    private OffsetDateTime grantedAt;

    // JPA requires a no-arg constructor and equals/hashCode on the PK holder.
    public static class UserRoleId implements Serializable {

        private String userId;
        private String role;

        public UserRoleId() {
        }

        public UserRoleId(String userId, String role) {
            this.userId = userId;
            this.role = role;
        }

        public String getUserId() {
            return userId;
        }

        public String getRole() {
            return role;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public void setRole(String role) {
            this.role = role;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof UserRoleId other)) {
                return false;
            }
            return Objects.equals(userId, other.userId) && Objects.equals(role, other.role);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, role);
        }
    }
}
