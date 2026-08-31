package com.vineyards.deerPlanner.guests.application.port;

import com.vineyards.deerPlanner.guests.domain.GuestGroup;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

@SecondaryPort
public interface GuestGroupOutPort {

  GuestGroup save(GuestGroup group);

  Optional<GuestGroup> findById(String id);

  List<GuestGroup> findByEventId(String eventId);

  void deleteById(String id);

  boolean existsByInvitationToken(String token);
}
