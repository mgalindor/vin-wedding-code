package com.vineyards.deerPlanner.invitation.outbound;

import com.vineyards.deerPlanner.invitation.application.port.EventInvitationConfigOutPort;
import com.vineyards.deerPlanner.invitation.domain.EventInvitationConfig;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.stereotype.Component;

@Component
@SecondaryAdapter
@RequiredArgsConstructor
@Slf4j
public class EventInvitationConfigRepositoryAdapter implements EventInvitationConfigOutPort {

  private final EventInvitationConfigJpaRepository jpa;

  @Override
  public Optional<EventInvitationConfig> findByEventId(String eventId) {
    return jpa.findById(eventId).map(EventInvitationConfigRepositoryAdapter::toDomain);
  }

  @Override
  public List<EventInvitationConfig> findByEventIds(Collection<String> eventIds) {
    return jpa.findAllById(eventIds).stream()
        .map(EventInvitationConfigRepositoryAdapter::toDomain)
        .toList();
  }

  @Override
  public Optional<EventInvitationConfig> findBySlug(String slug) {
    return jpa.findBySlug(slug).map(EventInvitationConfigRepositoryAdapter::toDomain);
  }

  @Override
  public EventInvitationConfig create(EventInvitationConfig config) {
    // eventId is a natural key (not a generated id), so Spring Data's isNew() check always
    // treats this entity as "not new" and calls merge() instead of persist() — even here, on
    // first creation — which means @CreatedDate never fires. Set createdAt explicitly so the
    // NOT NULL constraint is satisfied and the row records an accurate creation timestamp.
    EventInvitationConfigEntity entity = toEntity(config);
    entity.setCreatedAt(Instant.now());
    return toDomain(jpa.save(entity));
  }

  @Override
  public EventInvitationConfig update(EventInvitationConfig config) {
    // Load the managed entity and mutate it in place instead of merging a fresh transient
    // instance: this guarantees createdAt (never touched below) survives untouched, and lets
    // @LastModifiedDate/@PreUpdate fire normally against the loaded row.
    EventInvitationConfigEntity existing =
        jpa.findById(config.getEventId())
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "invitation_config.update.not-found eventId=" + config.getEventId()));
    existing.setTemplateId(config.getTemplateId());
    existing.setActive(config.isActive());
    existing.setPublishedAt(config.getPublishedAt());
    existing.setDeadline(config.getDeadline());
    existing.setRsvpEnabled(config.isRsvpEnabled());
    existing.setRsvpDeadline(config.getRsvpDeadline());
    existing.setSlug(config.getSlug());
    return toDomain(jpa.save(existing));
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
        .publishedAt(e.getPublishedAt())
        .deadline(e.getDeadline())
        .rsvpEnabled(e.isRsvpEnabled())
        .rsvpDeadline(e.getRsvpDeadline())
        .slug(e.getSlug())
        .updatedAt(e.getUpdatedAt() != null ? e.getUpdatedAt() : Instant.now())
        .build();
  }

  static EventInvitationConfigEntity toEntity(EventInvitationConfig d) {
    EventInvitationConfigEntity e = new EventInvitationConfigEntity();
    e.setEventId(d.getEventId());
    e.setTemplateId(d.getTemplateId());
    e.setActive(d.isActive());
    e.setPublishedAt(d.getPublishedAt());
    e.setDeadline(d.getDeadline());
    e.setRsvpEnabled(d.isRsvpEnabled());
    e.setRsvpDeadline(d.getRsvpDeadline());
    e.setSlug(d.getSlug());
    e.setUpdatedAt(d.getUpdatedAt());
    return e;
  }
}
