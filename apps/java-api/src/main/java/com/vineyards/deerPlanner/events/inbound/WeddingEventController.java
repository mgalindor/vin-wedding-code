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
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.security.access.prepost.PreAuthorize;
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
 *
 * <p>Same authorisation model as {@link EventController}: class-level role gate plus per-method
 * ownership check via the {@code @eventSecurity} SpEL bean.
 */
@Slf4j
@RestController
@PrimaryAdapter
@PreAuthorize("hasAnyRole('EventOrganizer', 'Administrator')")
@RequiredArgsConstructor
@RequestMapping("/api/v1/events/{eventId}")
@SecurityRequirement(name = "bearerAuth")
public class WeddingEventController {

  private static final String OWNER_EXPR =
      "hasRole('Administrator') or @eventSecurity.isOwner(#eventId, authentication.name)";

  private final WeddingEventInPort weddingApi;

  @GetMapping("/wedding-detail")
  @PreAuthorize(OWNER_EXPR)
  public WeddingDetailDto get(@PathVariable String eventId) {
    return weddingApi.getWeddingDetail(eventId);
  }

  @PutMapping("/wedding-detail")
  @PreAuthorize(OWNER_EXPR)
  public WeddingDetailDto updateDetail(
      @PathVariable String eventId, @Valid @RequestBody UpdateWeddingDetailDto body) {
    return weddingApi.updateWeddingDetail(eventId, body);
  }

  @PutMapping("/wedding-landing")
  @PreAuthorize(OWNER_EXPR)
  public WeddingDetailDto updateLanding(
      @PathVariable String eventId, @Valid @RequestBody WeddingLandingPayloadDto body) {
    return weddingApi.updateWeddingLanding(eventId, body);
  }

  @PutMapping("/wedding-story")
  @PreAuthorize(OWNER_EXPR)
  public WeddingDetailDto updateStory(
      @PathVariable String eventId, @Valid @RequestBody WeddingStoryPayloadDto body) {
    return weddingApi.updateWeddingStory(eventId, body);
  }

  @PutMapping("/wedding-dress-code")
  @PreAuthorize(OWNER_EXPR)
  public WeddingDetailDto updateDressCode(
      @PathVariable String eventId, @Valid @RequestBody WeddingDressCodePayloadDto body) {
    return weddingApi.updateWeddingDressCode(eventId, body);
  }

  @PutMapping("/wedding-gift-registry")
  @PreAuthorize(OWNER_EXPR)
  public WeddingDetailDto updateGiftRegistry(
      @PathVariable String eventId, @Valid @RequestBody WeddingGiftRegistryPayloadDto body) {
    return weddingApi.updateWeddingGiftRegistry(eventId, body);
  }

  @PutMapping("/wedding-parents")
  @PreAuthorize(OWNER_EXPR)
  public WeddingDetailDto updateParents(
      @PathVariable String eventId, @Valid @RequestBody WeddingParentsPayloadDto body) {
    return weddingApi.updateWeddingParents(eventId, body);
  }

  @PutMapping("/wedding-accommodation")
  @PreAuthorize(OWNER_EXPR)
  public WeddingDetailDto updateAccommodation(
      @PathVariable String eventId, @Valid @RequestBody WeddingAccommodationPayloadDto body) {
    return weddingApi.updateWeddingAccommodation(eventId, body);
  }
}
