package com.vineyards.deerPlanner.invitation.outbound;

import com.vineyards.deerPlanner.invitation.application.port.EventInvitationConfigRepository;
import com.vineyards.deerPlanner.invitation.domain.EventInvitationConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.Optional;

@Component
@SecondaryAdapter
@RequiredArgsConstructor
@Slf4j
public class EventInvitationConfigRepositoryAdapter implements EventInvitationConfigRepository {

    private final EventInvitationConfigJpaRepository jpa;

    @Override
    public Optional<EventInvitationConfig> findByEventId(String eventId) {
        return jpa.findById(eventId).map(EventInvitationConfigRepositoryAdapter::toDomain);
    }

    @Override
    public Optional<EventInvitationConfig> findBySlug(String slug) {
        return jpa.findBySlug(slug).map(EventInvitationConfigRepositoryAdapter::toDomain);
    }

    @Override
    public EventInvitationConfig save(EventInvitationConfig config) {
        return toDomain(jpa.save(toEntity(config)));
    }

    @Override
    public boolean existsBySlug(String slug) {
        return jpa.existsBySlug(slug);
    }

    static EventInvitationConfig toDomain(EventInvitationConfigEntity e) {
        return new EventInvitationConfig(
            e.getEventId(),
            e.getTemplateId(),
            e.isActive(),
            Optional.ofNullable(e.getPublishedAt()),
            Optional.ofNullable(e.getDeadline()),
            e.isRsvpEnabled(),
            Optional.ofNullable(e.getRsvpDeadline()),
            e.getSlug(),
            e.getUpdatedAt() != null ? e.getUpdatedAt() : OffsetDateTime.now()
        );
    }

    static EventInvitationConfigEntity toEntity(EventInvitationConfig d) {
        EventInvitationConfigEntity e = new EventInvitationConfigEntity();
        e.setEventId(d.eventId());
        e.setTemplateId(d.templateId());
        e.setActive(d.active());
        e.setPublishedAt(d.publishedAt().orElse(null));
        e.setDeadline(d.deadline().orElse(null));
        e.setRsvpEnabled(d.rsvpEnabled());
        e.setRsvpDeadline(d.rsvpDeadline().orElse(null));
        e.setSlug(d.slug());
        e.setUpdatedAt(d.updatedAt());
        return e;
    }
}
