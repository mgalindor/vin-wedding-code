package com.vineyards.deerPlanner.identity.domain;

import java.time.Instant;
import java.util.Set;
import lombok.Builder;
import lombok.Data;

@Data
@Builder(toBuilder = true)
public class User {
  private String id;
  private String username;
  private String displayName;
  private String email;
  private String phone;
  private String passwordHash;
  private boolean isActive;
  private Set<Role> roles;
  private Instant lastLoginAt;
  private Instant createdAt;
  private Instant updatedAt;
}
