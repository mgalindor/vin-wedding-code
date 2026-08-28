package com.vineyards.deerPlanner.guests.application.port;

import com.vineyards.deerPlanner.guests.domain.Guest;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

import java.util.List;
import java.util.Optional;

@SecondaryPort
public interface GuestRepository {

    Guest save(Guest guest);

    Optional<Guest> findById(String id);

    List<Guest> findByGroupId(String groupId);

    List<Guest> findByEventIdGroupIds(List<String> groupIds);

    void deleteById(String id);

    long countByGroupId(String groupId);
}
