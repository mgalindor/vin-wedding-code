package com.vineyards.deerPlanner.events.outbound;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WeddingEventJpaRepository extends JpaRepository<WeddingEventEntity, String> {
}
