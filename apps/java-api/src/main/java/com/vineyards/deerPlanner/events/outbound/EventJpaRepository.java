package com.vineyards.deerPlanner.events.outbound;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface EventJpaRepository
    extends JpaRepository<EventEntity, String>, JpaSpecificationExecutor<EventEntity> {

  List<EventEntity> findByOrganizerIdOrderByEventDateDesc(String organizerId);

  boolean existsByOrganizerIdAndEventDate(String organizerId, java.time.LocalDate eventDate);
}
