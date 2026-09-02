package com.vineyards.deerPlanner.guests.application.port;

import com.vineyards.deerPlanner.guests.domain.Guest;
import com.vineyards.deerPlanner.guests.outbound.GuestEntity;
import java.util.List;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.SecondaryPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@SecondaryPort
public interface GuestOutPort {

  Guest save(Guest guest);

  Optional<Guest> findById(String id);

  /** Non-paginated lookup of a group's guests (used internally for change-group primary logic). */
  List<Guest> findByGroupId(String groupId);

  List<Guest> findByEventIdGroupIds(List<String> groupIds);

  /**
   * Paginated, filterable search over the guest table. The specification is composed by the service
   * from the organiser's filter parameters (q, groupId, rsvpStatus).
   */
  Page<Guest> search(Specification<GuestEntity> spec, Pageable pageable);

  void deleteById(String id);

  long countByGroupId(String groupId);
}
