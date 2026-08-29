package com.vineyards.deerPlanner.invitation.outbound;

import com.vineyards.deerPlanner.invitation.application.port.EventInvitationConfigRepository;
import com.vineyards.deerPlanner.invitation.domain.EventInvitationConfig;
import java.time.OffsetDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.stereotype.Component;

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
    return EventInvitationConfig.builder()
        .eventId(e.getEventId())
        .templateId(e.getTemplateId())
        .active(e.isActive())
        .publishedAt(Optional.ofNullable(e.getPublishedAt()))
        .deadline(Optional.ofNullable(e.getDeadline()))
        .rsvpEnabled(e.isRsvpEnabled())
        .rsvpDeadline(Optional.ofNullable(e.getRsvpDeadline()))
        .slug(e.getSlug())
        .updatedAt(e.getUpdatedAt() != null ? e.getUpdatedAt() : OffsetDateTime.now())
        .build();
  }

  static EventInvitationConfigEntity toEntity(EventInvitationConfig d) {
    EventInvitationConfigEntity e = new EventInvitationConfigEntity();
    e.setEventId(d.getEventId());
    e.setTemplateId(d.getTemplateId());
    e.setActive(d.isActive());
    e.setPublishedAt(d.getPublishedAt().orElse(null));
    e.setDeadline(d.getDeadline().orElse(null));
    e.setRsvpEnabled(d.isRsvpEnabled());
    e.setRsvpDeadline(d.getRsvpDeadline().orElse(null));
    e.setSlug(d.getSlug());
    e.setUpdatedAt(d.getUpdatedAt());
    return e;
  }
}
