package com.vineyards.deerPlanner.events.inbound;

import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.PagedEventsResponse;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@PrimaryAdapter
@RequiredArgsConstructor
@RequestMapping(path = "/api/v1/events")
@PreAuthorize("hasRole('EventOrganizer')")
public class EventController {

  private final EventInPort eventApi;

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
  public PagedEventsResponse listMyEvents(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String eventType,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate eventDateFrom,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate eventDateTo,
      @PageableDefault(size = 20, sort = "eventDate", direction = Sort.Direction.DESC)
          Pageable pageable,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.listOwnEvents(
        jwt.getSubject(), q, status, eventType, eventDateFrom, eventDateTo, pageable);
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

  @PostMapping("/{id}/archive")
  public EventDto archiveEvent(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
    return eventApi.archiveEvent(id, jwt.getSubject());
  }

  // ----- Generic JSONB payloads (type-agnostic) -----

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
}
