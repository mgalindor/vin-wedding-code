package com.vineyards.deerPlanner.events.outbound;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventJpaRepository extends JpaRepository<EventEntity, String> {

    List<EventEntity> findByOrganizerIdOrderByEventDateDesc(String organizerId);

    boolean existsByOrganizerIdAndEventDate(String organizerId, java.time.LocalDate eventDate);
}
