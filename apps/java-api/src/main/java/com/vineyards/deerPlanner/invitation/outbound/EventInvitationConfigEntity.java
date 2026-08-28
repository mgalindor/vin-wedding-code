package com.vineyards.deerPlanner.invitation.outbound;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "event_invitation_config")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EventInvitationConfigEntity {

    @Id
    @Column(name = "event_id", nullable = false, length = 36)
    private String eventId;

    @Column(name = "template_id", length = 36)
    private String templateId;

    @Column(name = "is_active", nullable = false)
    private boolean active = false;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(name = "rsvp_enabled", nullable = false)
    private boolean rsvpEnabled = true;

    @Column(name = "rsvp_deadline")
    private LocalDate rsvpDeadline;

    @Column(name = "slug", nullable = false, length = 80)
    private String slug;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
