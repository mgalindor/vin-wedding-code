package com.vineyards.deerPlanner.guests.application.port;

import com.vineyards.deerPlanner.guests.domain.GuestGroup;
import java.util.Optional;

/**
 * Persistence port for {@link GuestGroup}. The cross-context lookup by invitation token is exposed
 * here so the invitation module can resolve a group from a public URL without going through any
 * ownership check (the token itself is the credential).
 */
public interface GuestGroupOutPort {

  GuestGroup save(GuestGroup group);

  Optional<GuestGroup> findById(String id);

  java.util.List<GuestGroup> findByEventId(String eventId);

  void deleteById(String id);

  boolean existsByInvitationToken(String token);

  Optional<GuestGroup> findByInvitationToken(String token);
}
