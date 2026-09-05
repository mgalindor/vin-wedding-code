package com.vineyards.deerPlanner.audit.domain;

/**
 * Source of the action that produced an audit entry. Lets the consumer of the log tell apart a
 * human user (admin or organizer) from a non-user actor (system bootstrap, public invitation RSVP).
 */
public enum ActorKind {
  user,
  system,
  invitation
}
