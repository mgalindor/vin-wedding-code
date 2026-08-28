package com.vineyards.deerPlanner.events.inbound;

import com.vineyards.deerPlanner.events.facade.EventApi;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.ListEventsResponse;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

/**
 * Primary adapter (REST controller) for the events aggregate. CRUD plus the two state
 * transitions (publish/archive). Payload updates live in {@link EventPayloadController}.
 *
 * <p>Authorization: {@code EventOrganizer} role required (enforced via {@code @PreAuthorize}).
 * Ownership is checked inside the application layer by comparing the actor's userId against
 * the event's {@code organizerId}. This double check makes it safe to call {@link EventApi}
 * from cross-module code paths that have already authenticated via Spring Security.
 */
@RestController
@RequestMapping(path = "/api/v1/events", produces = "application/json")
@PrimaryAdapter
@PreAuthorize("hasRole('EventOrganizer')")
@RequiredArgsConstructor
@Slf4j
public class EventController {

    private final EventApi eventApi;

    @PostMapping(consumes = "application/json")
    public ResponseEntity<EventDto> createEvent(
        @Valid @RequestBody CreateEventDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        EventDto created = eventApi.createEvent(body, jwt.getSubject());
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(created.id())
            .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/{id}")
    public EventDto getEvent(
        @PathVariable String id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.getEvent(id, jwt.getSubject());
    }

    @GetMapping
    public ListEventsResponse listMyEvents(@AuthenticationPrincipal Jwt jwt) {
        return eventApi.listOwnEvents(jwt.getSubject());
    }

    @PatchMapping(path = "/{id}", consumes = "application/json")
    public EventDto updateMetadata(
        @PathVariable String id,
        @Valid @RequestBody UpdateEventDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.updateEventMetadata(id, body, jwt.getSubject());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(
        @PathVariable String id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        eventApi.deleteEvent(id, jwt.getSubject());
    }

    @PostMapping("/{id}/publish")
    public EventDto publishEvent(
        @PathVariable String id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.publishEvent(id, jwt.getSubject());
    }

    @PostMapping("/{id}/archive")
    public EventDto archiveEvent(
        @PathVariable String id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return eventApi.archiveEvent(id, jwt.getSubject());
    }
}
