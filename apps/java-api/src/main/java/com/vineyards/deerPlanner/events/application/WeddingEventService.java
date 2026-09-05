package com.vineyards.deerPlanner.events.application;

import com.vineyards.deerPlanner.events.application.port.WeddingEventOutPort;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.events.domain.WeddingDetail;
import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.events.facade.WeddingAccommodationUpdatedAuditedEvent;
import com.vineyards.deerPlanner.events.facade.WeddingDetailUpdatedAuditedEvent;
import com.vineyards.deerPlanner.events.facade.WeddingDressCodeUpdatedAuditedEvent;
import com.vineyards.deerPlanner.events.facade.WeddingEventInPort;
import com.vineyards.deerPlanner.events.facade.WeddingGiftRegistryUpdatedAuditedEvent;
import com.vineyards.deerPlanner.events.facade.WeddingLandingUpdatedAuditedEvent;
import com.vineyards.deerPlanner.events.facade.WeddingParentsUpdatedAuditedEvent;
import com.vineyards.deerPlanner.events.facade.WeddingStoryUpdatedAuditedEvent;
import com.vineyards.deerPlanner.events.facade.dto.UpdateWeddingDetailDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingAccommodationPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDetailDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDressCodePayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingGiftRegistryPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingLandingPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingParentsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingStoryPayloadDto;
import com.vineyards.deerPlanner.events.facade.mapper.EventPayloadMapper;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Wedding-specific extension of {@link EventService}. Owns the {@code wedding_events} row,
 * including its creation, mutation and (eventually) deletion when an event type changes away from
 * wedding.
 *
 * <p>Authorisation (admin OR event organiser) is enforced by the inbound controller via SpEL
 * {@code @PreAuthorize}. This service trusts the caller and only verifies the event-type guard: the
 * wedding payloads only make sense for events of type {@code wedding}, so any other type is
 * rejected with a domain error.
 */
@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class WeddingEventService implements WeddingEventInPort {

  private final WeddingEventOutPort repository;
  private final EventInPort eventApi;
  private final EventPayloadMapper payloadMapper;
  private final ApplicationEventPublisher publisher;

  // ============== Reads ==============

  @Override
  @Transactional(readOnly = true)
  public WeddingDetailDto getWeddingDetail(String eventId) {
    verifyWeddingEvent(eventId);
    return toDto(eventId, loadOrEmpty(eventId));
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<WeddingDetailDto> findByEventId(String eventId) {
    return repository.findByEventId(eventId).map(d -> toDto(eventId, d));
  }

  // ============== Top-level detail ==============

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingDetail(String eventId, UpdateWeddingDetailDto dto) {
    verifyWeddingEvent(eventId);
    Optional<WeddingDetail> existing = repository.findByEventId(eventId);
    WeddingDetail current = existing.orElseGet(WeddingEventService::emptyDetail);
    List<String> changed = new ArrayList<>();
    boolean partner1Changed =
        dto.partner1Name() != null && !dto.partner1Name().equals(current.getPartner1Name());
    boolean partner2Changed =
        dto.partner2Name() != null && !dto.partner2Name().equals(current.getPartner2Name());
    boolean countdownChanged =
        dto.countdownEnabled() != null && dto.countdownEnabled() != current.isCountdownEnabled();

    if (partner1Changed) changed.add("partner1Name");
    if (partner2Changed) changed.add("partner2Name");
    if (countdownChanged) changed.add("countdownEnabled");

    WeddingDetail updated =
        WeddingDetail.builder()
            .partner1Name(partner1Changed ? dto.partner1Name() : current.getPartner1Name())
            .partner2Name(partner2Changed ? dto.partner2Name() : current.getPartner2Name())
            .countdownEnabled(
                countdownChanged ? dto.countdownEnabled() : current.isCountdownEnabled())
            .landingPayload(current.getLandingPayload())
            .storyPayload(current.getStoryPayload())
            .dressCodePayload(current.getDressCodePayload())
            .giftRegistryPayload(current.getGiftRegistryPayload())
            .parentsPayload(current.getParentsPayload())
            .accommodationPayload(current.getAccommodationPayload())
            .build();
    if (existing.isPresent()) {
      repository.update(eventId, updated);
    } else {
      repository.create(eventId, updated);
    }
    if (!changed.isEmpty()) {
      publisher.publishEvent(new WeddingDetailUpdatedAuditedEvent(eventId, changed, Instant.now()));
    }
    log.info("wedding_event.detail_updated eventId={}", eventId);
    return toDto(eventId, updated);
  }

  // ============== Per-payload updates ==============

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingLanding(String eventId, WeddingLandingPayloadDto dto) {
    return mutatePayload(
        eventId,
        d -> d.setLandingPayload(payloadMapper.toPayload(dto)),
        "landing",
        new WeddingLandingUpdatedAuditedEvent(eventId, Instant.now()));
  }

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingStory(String eventId, WeddingStoryPayloadDto dto) {
    return mutatePayload(
        eventId,
        d -> d.setStoryPayload(payloadMapper.toPayload(dto)),
        "story",
        new WeddingStoryUpdatedAuditedEvent(eventId, Instant.now()));
  }

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingDressCode(String eventId, WeddingDressCodePayloadDto dto) {
    return mutatePayload(
        eventId,
        d -> d.setDressCodePayload(payloadMapper.toPayload(dto)),
        "dressCode",
        new WeddingDressCodeUpdatedAuditedEvent(eventId, Instant.now()));
  }

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingGiftRegistry(
      String eventId, WeddingGiftRegistryPayloadDto dto) {
    return mutatePayload(
        eventId,
        d -> d.setGiftRegistryPayload(payloadMapper.toPayload(dto)),
        "giftRegistry",
        new WeddingGiftRegistryUpdatedAuditedEvent(eventId, Instant.now()));
  }

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingParents(String eventId, WeddingParentsPayloadDto dto) {
    return mutatePayload(
        eventId,
        d -> d.setParentsPayload(payloadMapper.toPayload(dto)),
        "parents",
        new WeddingParentsUpdatedAuditedEvent(eventId, Instant.now()));
  }

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingAccommodation(
      String eventId, WeddingAccommodationPayloadDto dto) {
    return mutatePayload(
        eventId,
        d -> d.setAccommodationPayload(payloadMapper.toPayload(dto)),
        "accommodation",
        new WeddingAccommodationUpdatedAuditedEvent(eventId, Instant.now()));
  }

  // ============== Helpers ==============

  private WeddingDetailDto mutatePayload(
      String eventId, Consumer<WeddingDetail> mutator, String section, Object auditEvent) {
    verifyWeddingEvent(eventId);
    Optional<WeddingDetail> existing = repository.findByEventId(eventId);
    WeddingDetail current = existing.orElseGet(WeddingEventService::emptyDetail);
    mutator.accept(current);
    if (existing.isPresent()) {
      repository.update(eventId, current);
    } else {
      repository.create(eventId, current);
    }
    publisher.publishEvent(auditEvent);
    log.info("wedding_event.payload_updated eventId={} section={}", eventId, section);
    return toDto(eventId, current);
  }

  private void verifyWeddingEvent(String eventId) {
    var event = eventApi.getEvent(eventId);
    if (event.eventType() != EventType.wedding) {
      throw new BusinessError(
          "not_wedding_event",
          "Event " + eventId + " is not a wedding (was " + event.eventType() + ")");
    }
  }

  private WeddingDetail loadOrEmpty(String eventId) {
    return repository.findByEventId(eventId).orElseGet(WeddingEventService::emptyDetail);
  }

  private static WeddingDetail emptyDetail() {
    return WeddingDetail.builder()
        .partner1Name("")
        .partner2Name("")
        .countdownEnabled(false)
        .landingPayload(null)
        .storyPayload(null)
        .dressCodePayload(null)
        .giftRegistryPayload(null)
        .parentsPayload(null)
        .accommodationPayload(null)
        .build();
  }

  private WeddingDetailDto toDto(String eventId, WeddingDetail d) {
    return new WeddingDetailDto(
        eventId,
        d.getPartner1Name(),
        d.getPartner2Name(),
        d.isCountdownEnabled(),
        d.getLandingPayload() == null ? null : payloadMapper.toDto(d.getLandingPayload()),
        d.getStoryPayload() == null ? null : payloadMapper.toDto(d.getStoryPayload()),
        d.getDressCodePayload() == null ? null : payloadMapper.toDto(d.getDressCodePayload()),
        d.getGiftRegistryPayload() == null ? null : payloadMapper.toDto(d.getGiftRegistryPayload()),
        d.getParentsPayload() == null ? null : payloadMapper.toDto(d.getParentsPayload()),
        d.getAccommodationPayload() == null
            ? null
            : payloadMapper.toDto(d.getAccommodationPayload()));
  }
}
