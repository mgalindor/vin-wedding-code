package com.vineyards.deerPlanner.events.outbound;

import com.vineyards.deerPlanner.events.application.port.WeddingEventOutPort;
import com.vineyards.deerPlanner.events.domain.WeddingDetail;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.stereotype.Component;

/**
 * Adapts {@link WeddingEventOutPort} to the {@code wedding_events} table. Kept separate from {@link
 * EventRepositoryAdapter} so that the base event flow has zero knowledge of wedding specifics — and
 * so that {@code WeddingEventService} owns the lifecycle of the detail row (creation, mutation,
 * deletion on type switch).
 */
@Component
@SecondaryAdapter
@RequiredArgsConstructor
@Slf4j
public class WeddingEventRepositoryAdapter implements WeddingEventOutPort {

  private final WeddingEventJpaRepository jpa;

  @Override
  public Optional<WeddingDetail> findByEventId(String eventId) {
    return jpa.findById(eventId).map(WeddingEventRepositoryAdapter::toDomain);
  }

  @Override
  public void create(String eventId, WeddingDetail detail) {
    jpa.save(toEntity(eventId, detail));
  }

  @Override
  public void update(String eventId, WeddingDetail detail) {
    // No @CreatedDate/@LastModifiedDate tracked on this entity, so load-and-mutate isn't strictly
    // required for correctness here — but it keeps the contract consistent with the other
    // adapters and avoids relying on merge() semantics for a natural-key entity.
    WeddingEventEntity existing =
        jpa.findById(eventId)
            .orElseThrow(
                () ->
                    new IllegalStateException("wedding_event.update.not-found eventId=" + eventId));
    existing.setPartner1Name(detail.getPartner1Name());
    existing.setPartner2Name(detail.getPartner2Name());
    existing.setCountdownEnabled(detail.isCountdownEnabled());
    existing.setLandingPayload(detail.getLandingPayload());
    existing.setStoryPayload(detail.getStoryPayload());
    existing.setDressCodePayload(detail.getDressCodePayload());
    existing.setGiftRegistryPayload(detail.getGiftRegistryPayload());
    existing.setParentsPayload(detail.getParentsPayload());
    existing.setAccommodationPayload(detail.getAccommodationPayload());
    jpa.save(existing);
  }

  @Override
  public void deleteByEventId(String eventId) {
    jpa.findById(eventId).ifPresent(jpa::delete);
  }

  static WeddingDetail toDomain(WeddingEventEntity e) {
    return WeddingDetail.builder()
        .partner1Name(e.getPartner1Name())
        .partner2Name(e.getPartner2Name())
        .countdownEnabled(e.isCountdownEnabled())
        .landingPayload(e.getLandingPayload())
        .storyPayload(e.getStoryPayload())
        .dressCodePayload(e.getDressCodePayload())
        .giftRegistryPayload(e.getGiftRegistryPayload())
        .parentsPayload(e.getParentsPayload())
        .accommodationPayload(e.getAccommodationPayload())
        .build();
  }

  static WeddingEventEntity toEntity(String eventId, WeddingDetail d) {
    WeddingEventEntity e = new WeddingEventEntity();
    e.setEventId(eventId);
    e.setPartner1Name(d.getPartner1Name());
    e.setPartner2Name(d.getPartner2Name());
    e.setCountdownEnabled(d.isCountdownEnabled());
    e.setLandingPayload(d.getLandingPayload());
    e.setStoryPayload(d.getStoryPayload());
    e.setDressCodePayload(d.getDressCodePayload());
    e.setGiftRegistryPayload(d.getGiftRegistryPayload());
    e.setParentsPayload(d.getParentsPayload());
    e.setAccommodationPayload(d.getAccommodationPayload());
    return e;
  }

  // Static helpers exposed for tests that want to build payloads with sane defaults.
}
