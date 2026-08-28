package com.vineyards.deerPlanner.events.outbound;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "wedding_events")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class WeddingEventEntity {

    @Id
    @Column(name = "event_id", nullable = false, length = 36)
    private String eventId;

    @Column(name = "partner1_name", nullable = false, length = 180)
    private String partner1Name;

    @Column(name = "partner2_name", nullable = false, length = 180)
    private String partner2Name;

    @Column(name = "countdown_enabled", nullable = false)
    private boolean countdownEnabled = true;

    // columnDefinition is intentionally absent: JSONB-style raw JSON strings. The prod
    // schema is declared by 003-events-schema.yaml as jsonb; slice tests use the
    // Hibernate-default H2-compatible SQL type (longvarchar).
    @Column(name = "landing_payload")
    private String landingPayload;

    @Column(name = "story_payload")
    private String storyPayload;

    @Column(name = "dress_code_payload")
    private String dressCodePayload;

    @Column(name = "gift_registry_payload")
    private String giftRegistryPayload;

    @Column(name = "parents_payload")
    private String parentsPayload;

    @Column(name = "accommodation_payload")
    private String accommodationPayload;
}
