package com.vineyards.deerPlanner.events.application;

import com.vineyards.deerPlanner.events.application.port.WeddingEventOutPort;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.events.domain.WeddingDetail;
import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.events.facade.WeddingEventInPort;
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
import java.util.Optional;
import java.util.function.Consumer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Wedding-specific extension of {@link EventService}. Owns the {@code wedding_events} row,
 * including its creation, mutation and (eventually) deletion when an event type changes away from
 * wedding. Every method enforces two preconditions: (1) the calling user owns the event — delegated
 * to {@link EventInPort#getEvent}; (2) the event's type is actually {@code wedding}. The second
 * guard is what makes this a true extension rather than a free-form JSON store.
 */
@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class WeddingEventService implements WeddingEventInPort {

  private final WeddingEventOutPort repository;
  private final EventInPort eventApi;
  private final EventPayloadMapper payloadMapper;

  // ============== Reads ==============

  @Override
  @Transactional(readOnly = true)
  public WeddingDetailDto getWeddingDetail(String eventId, String actorUserId) {
    verifyWeddingEvent(eventId, actorUserId);
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
  public WeddingDetailDto updateWeddingDetail(
      String eventId, UpdateWeddingDetailDto dto, String actorUserId) {
    verifyWeddingEvent(eventId, actorUserId);
    WeddingDetail current = loadOrEmpty(eventId);
    WeddingDetail updated =
        WeddingDetail.builder()
            .partner1Name(
                dto.partner1Name() != null ? dto.partner1Name() : current.getPartner1Name())
            .partner2Name(
                dto.partner2Name() != null ? dto.partner2Name() : current.getPartner2Name())
            .countdownEnabled(
                dto.countdownEnabled() != null
                    ? dto.countdownEnabled()
                    : current.isCountdownEnabled())
            .landingPayload(current.getLandingPayload())
            .storyPayload(current.getStoryPayload())
            .dressCodePayload(current.getDressCodePayload())
            .giftRegistryPayload(current.getGiftRegistryPayload())
            .parentsPayload(current.getParentsPayload())
            .accommodationPayload(current.getAccommodationPayload())
            .build();
    repository.save(eventId, updated);
    log.info("wedding_event.detail_updated eventId={} actorUserId={}", eventId, actorUserId);
    return toDto(eventId, updated);
  }

  // ============== Per-payload updates ==============

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingLanding(
      String eventId, WeddingLandingPayloadDto dto, String actorUserId) {
    return mutatePayload(
        eventId, actorUserId, d -> d.setLandingPayload(payloadMapper.toPayload(dto)), "landing");
  }

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingStory(
      String eventId, WeddingStoryPayloadDto dto, String actorUserId) {
    return mutatePayload(
        eventId, actorUserId, d -> d.setStoryPayload(payloadMapper.toPayload(dto)), "story");
  }

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingDressCode(
      String eventId, WeddingDressCodePayloadDto dto, String actorUserId) {
    return mutatePayload(
        eventId,
        actorUserId,
        d -> d.setDressCodePayload(payloadMapper.toPayload(dto)),
        "dressCode");
  }

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingGiftRegistry(
      String eventId, WeddingGiftRegistryPayloadDto dto, String actorUserId) {
    return mutatePayload(
        eventId,
        actorUserId,
        d -> d.setGiftRegistryPayload(payloadMapper.toPayload(dto)),
        "giftRegistry");
  }

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingParents(
      String eventId, WeddingParentsPayloadDto dto, String actorUserId) {
    return mutatePayload(
        eventId, actorUserId, d -> d.setParentsPayload(payloadMapper.toPayload(dto)), "parents");
  }

  @Override
  @Transactional
  public WeddingDetailDto updateWeddingAccommodation(
      String eventId, WeddingAccommodationPayloadDto dto, String actorUserId) {
    return mutatePayload(
        eventId,
        actorUserId,
        d -> d.setAccommodationPayload(payloadMapper.toPayload(dto)),
        "accommodation");
  }

  // ============== Helpers ==============

  private WeddingDetailDto mutatePayload(
      String eventId, String actorUserId, Consumer<WeddingDetail> mutator, String section) {
    verifyWeddingEvent(eventId, actorUserId);
    WeddingDetail current = loadOrEmpty(eventId);
    mutator.accept(current);
    repository.save(eventId, current);
    log.info(
        "wedding_event.payload_updated eventId={} section={} actorUserId={}",
        eventId,
        section,
        actorUserId);
    return toDto(eventId, current);
  }

  private void verifyWeddingEvent(String eventId, String actorUserId) {
    var event = eventApi.getEvent(eventId, actorUserId);
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
