package com.vineyards.deerPlanner.events.inbound;

import com.vineyards.deerPlanner.events.facade.EventApi;
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

/**
 * Secondary primary adapter dedicated to PUT-on-payload endpoints. Each path mirrors one
 * JSONB column from the data model — payloads are stored as strings, so a PUT replaces the
 * whole sub-tree. Responses are the full {@code EventDto} so the FE can refresh its
 * snapshot with one round-trip.
 */
@RestController
@RequestMapping(path = "/api/v1/events", produces = "application/json")
@PrimaryAdapter
@PreAuthorize("hasRole('EventOrganizer')")
@RequiredArgsConstructor
@Slf4j
public class EventPayloadController {

    private final EventApi eventApi;

    @PutMapping(path = "/{id}/locations", consumes = "application/json")
    public EventDto updateLocations(
        @PathVariable String id,
        @Valid @RequestBody LocationsPayloadDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.updateLocations(id, body, jwt.getSubject());
    }

    @PutMapping(path = "/{id}/program", consumes = "application/json")
    public EventDto updateProgram(
        @PathVariable String id,
        @Valid @RequestBody ProgramPayloadDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.updateProgram(id, body, jwt.getSubject());
    }

    @PutMapping(path = "/{id}/contacts", consumes = "application/json")
    public EventDto updateContacts(
        @PathVariable String id,
        @Valid @RequestBody ContactsPayloadDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.updateContacts(id, body, jwt.getSubject());
    }

    @PutMapping(path = "/{id}/wedding-landing", consumes = "application/json")
    public EventDto updateWeddingLanding(
        @PathVariable String id,
        @Valid @RequestBody WeddingLandingPayloadDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.updateWeddingLanding(id, body, jwt.getSubject());
    }

    @PutMapping(path = "/{id}/wedding-story", consumes = "application/json")
    public EventDto updateWeddingStory(
        @PathVariable String id,
        @Valid @RequestBody WeddingStoryPayloadDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.updateWeddingStory(id, body, jwt.getSubject());
    }

    @PutMapping(path = "/{id}/wedding-dress-code", consumes = "application/json")
    public EventDto updateWeddingDressCode(
        @PathVariable String id,
        @Valid @RequestBody WeddingDressCodePayloadDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.updateWeddingDressCode(id, body, jwt.getSubject());
    }

    @PutMapping(path = "/{id}/wedding-gift-registry", consumes = "application/json")
    public EventDto updateWeddingGiftRegistry(
        @PathVariable String id,
        @Valid @RequestBody WeddingGiftRegistryPayloadDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.updateWeddingGiftRegistry(id, body, jwt.getSubject());
    }

    @PutMapping(path = "/{id}/wedding-parents", consumes = "application/json")
    public EventDto updateWeddingParents(
        @PathVariable String id,
        @Valid @RequestBody WeddingParentsPayloadDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.updateWeddingParents(id, body, jwt.getSubject());
    }

    @PutMapping(path = "/{id}/wedding-accommodation", consumes = "application/json")
    public EventDto updateWeddingAccommodation(
        @PathVariable String id,
        @Valid @RequestBody WeddingAccommodationPayloadDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.updateWeddingAccommodation(id, body, jwt.getSubject());
    }
}
