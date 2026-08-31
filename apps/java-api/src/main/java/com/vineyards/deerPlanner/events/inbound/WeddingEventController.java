package com.vineyards.deerPlanner.events.inbound;

import com.vineyards.deerPlanner.events.facade.WeddingEventInPort;
import com.vineyards.deerPlanner.events.facade.dto.UpdateWeddingDetailDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingAccommodationPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDetailDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDressCodePayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingGiftRegistryPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingLandingPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingParentsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingStoryPayloadDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Wedding-specific extension of the events API. Lives under {@code /api/v1/events/{eventId}/...}
 * and is the single owner of the wedding detail row. Future event-type extensions (birthday,
 * anniversary, corporate) follow the same shape — one controller per type, all under the same
 * parent path.
 */
@Slf4j
@RestController
@PrimaryAdapter
@PreAuthorize("hasRole('EventOrganizer')")
@RequiredArgsConstructor
@RequestMapping("/api/v1/events/{eventId}")
public class WeddingEventController {

  private final WeddingEventInPort weddingApi;

  @GetMapping("/wedding-detail")
  public WeddingDetailDto get(@PathVariable String eventId, @AuthenticationPrincipal Jwt jwt) {
    return weddingApi.getWeddingDetail(eventId, jwt.getSubject());
  }

  @PutMapping("/wedding-detail")
  public WeddingDetailDto updateDetail(
      @PathVariable String eventId,
      @Valid @RequestBody UpdateWeddingDetailDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return weddingApi.updateWeddingDetail(eventId, body, jwt.getSubject());
  }

  @PutMapping("/wedding-landing")
  public WeddingDetailDto updateLanding(
      @PathVariable String eventId,
      @Valid @RequestBody WeddingLandingPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return weddingApi.updateWeddingLanding(eventId, body, jwt.getSubject());
  }

  @PutMapping("/wedding-story")
  public WeddingDetailDto updateStory(
      @PathVariable String eventId,
      @Valid @RequestBody WeddingStoryPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return weddingApi.updateWeddingStory(eventId, body, jwt.getSubject());
  }

  @PutMapping("/wedding-dress-code")
  public WeddingDetailDto updateDressCode(
      @PathVariable String eventId,
      @Valid @RequestBody WeddingDressCodePayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return weddingApi.updateWeddingDressCode(eventId, body, jwt.getSubject());
  }

  @PutMapping("/wedding-gift-registry")
  public WeddingDetailDto updateGiftRegistry(
      @PathVariable String eventId,
      @Valid @RequestBody WeddingGiftRegistryPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return weddingApi.updateWeddingGiftRegistry(eventId, body, jwt.getSubject());
  }

  @PutMapping("/wedding-parents")
  public WeddingDetailDto updateParents(
      @PathVariable String eventId,
      @Valid @RequestBody WeddingParentsPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return weddingApi.updateWeddingParents(eventId, body, jwt.getSubject());
  }

  @PutMapping("/wedding-accommodation")
  public WeddingDetailDto updateAccommodation(
      @PathVariable String eventId,
      @Valid @RequestBody WeddingAccommodationPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return weddingApi.updateWeddingAccommodation(eventId, body, jwt.getSubject());
  }
}
