package com.vineyards.deerPlanner.guests.outbound;

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

import java.time.OffsetDateTime;

@Entity
@Table(name = "guest_groups")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class GuestGroupEntity {

    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "event_id", nullable = false, length = 36)
    private String eventId;

    @Column(name = "name", nullable = false, length = 180)
    private String name;

    @Column(name = "side", length = 80)
    private String side;

    @Column(name = "relationship", nullable = false, length = 20)
    private String relationship;

    @Column(name = "shared_email", length = 254)
    private String sharedEmail;

    @Column(name = "shared_phone", length = 32)
    private String sharedPhone;

    @Column(name = "primary_guest_id", length = 36)
    private String primaryGuestId;

    @Column(name = "invitation_token", nullable = false, length = 36)
    private String invitationToken;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onPersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
