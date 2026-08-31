package com.vineyards.deerPlanner.events.domain;

public enum EventStatus {
  draft,
  published,
  archived;

  /**
   * The MVP has no explicit "publish" transition — the public URL becomes reachable when the
   * organizer activates the invitation config (see {@code EventInvitationConfigService}). The
   * {@code published} state is preserved for historical data and as a future home for any lifecycle
   * that does warrant a transition (e.g. photo uploads after the event). Today the only reachable
   * transitions from {@code draft} are into {@code archived}.
   */
  public boolean canTransitionTo(EventStatus next) {
    if (next == null || this == next) {
      return false;
    }
    return switch (this) {
      case draft -> next == archived;
      case published -> next == archived;
      case archived -> false;
    };
  }
}
