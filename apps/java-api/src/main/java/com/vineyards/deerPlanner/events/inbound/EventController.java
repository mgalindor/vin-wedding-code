package com.vineyards.deerPlanner.events.inbound;

import com.vineyards.deerPlanner.events.facade.EventFacade;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.ListEventsResponse;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@PrimaryAdapter
@RequiredArgsConstructor
@RequestMapping(path = "/api/v1/events")
@PreAuthorize("hasRole('EventOrganizer')")
public class EventController {

  private final EventFacade eventApi;

  @PostMapping
  public ResponseEntity<EventDto> createEvent(
      @Valid @RequestBody CreateEventDto body, @AuthenticationPrincipal Jwt jwt) {
    EventDto created = eventApi.createEvent(body, jwt.getSubject());
    URI location = URI.create("/api/v1/events/" + created.id());
    return ResponseEntity.created(location).body(created);
  }

  @GetMapping("/{id}")
  public EventDto getEvent(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
    return eventApi.getEvent(id, jwt.getSubject());
  }

  @GetMapping
  public ListEventsResponse listMyEvents(@AuthenticationPrincipal Jwt jwt) {
    return eventApi.listOwnEvents(jwt.getSubject());
  }

  @PatchMapping(path = "/{id}")
  public EventDto updateMetadata(
      @PathVariable String id,
      @Valid @RequestBody UpdateEventDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.updateEventMetadata(id, body, jwt.getSubject());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteEvent(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
    eventApi.deleteEvent(id, jwt.getSubject());
  }

  @PostMapping("/{id}/publish")
  public EventDto publishEvent(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
    return eventApi.publishEvent(id, jwt.getSubject());
  }

  @PostMapping("/{id}/archive")
  public EventDto archiveEvent(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
    return eventApi.archiveEvent(id, jwt.getSubject());
  }
}
