package com.vineyards.deerPlanner.events.outbound;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "events")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EventEntity {

    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "organizer_id", nullable = false, length = 36)
    private String organizerId;

    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType;

    @Column(name = "title", nullable = false, length = 180)
    private String title;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    // JSONB payloads are stored as raw strings — the application parses them into typed
    // DTOs at the adapter boundary (events/application + facade/dto). The entity itself
    // never depends on Jackson.
    // JSONB payloads are stored as raw strings — the application parses them into typed
    // DTOs at the adapter boundary (events/application + facade/dto). The entity itself
    // never depends on Jackson.
    // columnDefinition is intentionally absent so Hibernate's H2-compatible SQL type
    // (LONGVARCHAR) is used in slice tests. The production schema is the one declared in
    // 003-events-schema.yaml (jsonb) — Liquibase, not Hibernate, owns the prod DDL.
    @Column(name = "locations_payload")
    private String locationsPayload;

    @Column(name = "program_payload")
    private String programPayload;

    @Column(name = "contacts_payload")
    private String contactsPayload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onPersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
