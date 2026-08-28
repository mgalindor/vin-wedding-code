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
@Table(name = "guests")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class GuestEntity {

    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "group_id", nullable = false, length = 36)
    private String groupId;

    @Column(name = "first_name", nullable = false, length = 120)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 120)
    private String lastName;

    @Column(name = "email", length = 254)
    private String email;

    @Column(name = "phone", length = 32)
    private String phone;

    @Column(name = "dietary_notes", columnDefinition = "longvarchar")
    private String dietaryNotes;

    @Column(name = "is_primary", nullable = false)
    private boolean primary = false;

    @Column(name = "invitation_token", nullable = false, length = 36)
    private String invitationToken;

    @Column(name = "rsvp_status", nullable = false, length = 20)
    private String rsvpStatus = "pending";

    @Column(name = "rsvp_confirmed_at")
    private OffsetDateTime rsvpConfirmedAt;

    @Column(name = "rsvp_message", columnDefinition = "longvarchar")
    private String rsvpMessage;

    @Column(name = "rsvp_dietary_choice", length = 80)
    private String rsvpDietaryChoice;

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
