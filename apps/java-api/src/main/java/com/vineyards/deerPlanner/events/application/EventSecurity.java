package com.vineyards.deerPlanner.events.application;

import com.vineyards.deerPlanner.events.application.port.EventOutPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Helper bean referenced by SpEL {@code @PreAuthorize} expressions on event controllers. Evaluates
 * whether {@code username} is the original organiser of {@code eventId}.
 *
 * <p>Admins bypass this check at the controller level via {@code hasRole('Administrator')}, so
 * {@link #isOwner} is only consulted for non-admin actors.
 *
 * <p>Returns {@code true} when the event does not exist so the security check passes and the
 * service answers with the standard 404. A 403 here would otherwise leak the difference between
 * "event doesn't exist" and "exists but not yours".
 */
@Component("eventSecurity")
@RequiredArgsConstructor
public class EventSecurity {

  private final EventOutPort eventRepository;

  public boolean isOwner(String eventId, String username) {
    if (eventId == null || username == null) {
      return false;
    }
    return eventRepository
        .findById(eventId)
        .map(event -> username.equals(event.getOrganizerId()))
        .orElse(true);
  }
}
