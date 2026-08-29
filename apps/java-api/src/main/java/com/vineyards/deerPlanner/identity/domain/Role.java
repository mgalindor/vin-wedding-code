package com.vineyards.deerPlanner.identity.domain;

/**
 * Application-level role. Authority strings follow the Spring Security convention ({@code
 * ROLE_Administrator}, {@code ROLE_EventOrganizer}).
 */
public enum Role {
  Administrator,
  EventOrganizer;

  public String authority() {
    return "ROLE_" + name();
  }
}
