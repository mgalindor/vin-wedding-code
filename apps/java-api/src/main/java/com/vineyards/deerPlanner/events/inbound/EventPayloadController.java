package com.vineyards.deerPlanner.events.inbound;

import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingAccommodationPayloadDto;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/events")
@PrimaryAdapter
@PreAuthorize("hasRole('EventOrganizer')")
@RequiredArgsConstructor
@Slf4j
public class EventPayloadController {

  private final EventInPort eventApi;

  @PutMapping(path = "/{id}/locations")
  public EventDto updateLocations(
      @PathVariable String id,
      @Valid @RequestBody LocationsPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.updateLocations(id, body, jwt.getSubject());
  }

  @PutMapping(path = "/{id}/program")
  public EventDto updateProgram(
      @PathVariable String id,
      @Valid @RequestBody ProgramPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.updateProgram(id, body, jwt.getSubject());
  }

  @PutMapping(path = "/{id}/contacts")
  public EventDto updateContacts(
      @PathVariable String id,
      @Valid @RequestBody ContactsPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.updateContacts(id, body, jwt.getSubject());
  }

  @PutMapping(path = "/{id}/wedding-landing")
  public EventDto updateWeddingLanding(
      @PathVariable String id,
      @Valid @RequestBody WeddingLandingPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.updateWeddingLanding(id, body, jwt.getSubject());
  }

  @PutMapping(path = "/{id}/wedding-story")
  public EventDto updateWeddingStory(
      @PathVariable String id,
      @Valid @RequestBody WeddingStoryPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.updateWeddingStory(id, body, jwt.getSubject());
  }

  @PutMapping(path = "/{id}/wedding-dress-code")
  public EventDto updateWeddingDressCode(
      @PathVariable String id,
      @Valid @RequestBody WeddingDressCodePayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.updateWeddingDressCode(id, body, jwt.getSubject());
  }

  @PutMapping(path = "/{id}/wedding-gift-registry")
  public EventDto updateWeddingGiftRegistry(
      @PathVariable String id,
      @Valid @RequestBody WeddingGiftRegistryPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.updateWeddingGiftRegistry(id, body, jwt.getSubject());
  }

  @PutMapping(path = "/{id}/wedding-parents")
  public EventDto updateWeddingParents(
      @PathVariable String id,
      @Valid @RequestBody WeddingParentsPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.updateWeddingParents(id, body, jwt.getSubject());
  }

  @PutMapping(path = "/{id}/wedding-accommodation")
  public EventDto updateWeddingAccommodation(
      @PathVariable String id,
      @Valid @RequestBody WeddingAccommodationPayloadDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.updateWeddingAccommodation(id, body, jwt.getSubject());
  }
}
