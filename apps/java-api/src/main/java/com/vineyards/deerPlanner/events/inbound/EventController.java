package com.vineyards.deerPlanner.events.inbound;

import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventSummaryDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.PagedEventsResponse;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ReassignOrganizerDto;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import com.vineyards.deerPlanner.invitation.facade.EventInvitationConfigInPort;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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

/**
 * Generic event lifecycle endpoints. Authorisation is per-method: anyone with the {@code
 * EventOrganizer} or {@code Administrator} role can reach the controller; the per-resource methods
 * additionally require ownership unless the actor has the {@code Administrator} role — the
 * {@code @eventSecurity} bean answers "is this username the organiser of this event id?".
 */
@Slf4j
@RestController
@PrimaryAdapter
@RequiredArgsConstructor
@RequestMapping(path = "/api/v1/events")
@PreAuthorize("hasAnyRole('EventOrganizer', 'Administrator')")
@SecurityRequirement(name = "bearerAuth")
public class EventController {

  private static final String ADMIN = "Administrator";
  private static final String OWNER_EXPR =
      "hasRole('Administrator') or @eventSecurity.isOwner(#id, authentication.name)";

  /**
   * Whitelist of properties that {@code sort} may reference. Mirrors the columns exposed by {@code
   * EventEntity}; sorting by anything else (typos, unmapped/nested paths) would otherwise surface
   * as an unhandled JPA {@code PropertyReferenceException} (HTTP 500) at query time.
   */
  private static final java.util.Set<String> SORTABLE_PROPERTIES =
      java.util.Set.of("organizerId", "eventType", "title", "eventDate", "status", "createdAt");

  private final EventInPort eventApi;
  private final EventInvitationConfigInPort invitationConfigApi;

  @PostMapping
  public ResponseEntity<EventDto> createEvent(
      @Valid @RequestBody CreateEventDto body, @AuthenticationPrincipal Jwt jwt) {
    EventDto created = eventApi.createEvent(body, jwt.getSubject());
    URI location = URI.create("/api/v1/events/" + created.id());
    return ResponseEntity.created(location).body(created);
  }

  @GetMapping("/{id}")
  @PreAuthorize(OWNER_EXPR)
  public EventDto getEvent(@PathVariable String id) {
    return eventApi.getEvent(id);
  }

  @GetMapping
  public PagedEventsResponse listMyEvents(
      @RequestParam(required = false) String title,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String eventType,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate eventDateFrom,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate eventDateTo,
      @PageableDefault(size = 20, sort = "eventDate", direction = Sort.Direction.DESC)
          Pageable pageable,
      @AuthenticationPrincipal Jwt jwt) {
    validateSort(pageable.getSort());
    boolean admin = isAdmin(jwt);
    PagedEventsResponse response =
        eventApi.listOwnEvents(
            jwt.getSubject(),
            admin,
            title,
            status,
            eventType,
            eventDateFrom,
            eventDateTo,
            pageable);
    return withTemplateCodes(response);
  }

  /**
   * Overlays each summary with its selected invitation template's {@code code}, resolved via the
   * invitation module's facade in a single batch call (avoids one invitation-config lookup per card
   * on the FE dashboard).
   */
  private PagedEventsResponse withTemplateCodes(PagedEventsResponse response) {
    List<EventSummaryDto> items = response.page().items();
    List<String> eventIds = items.stream().map(EventSummaryDto::id).toList();
    Map<String, String> templateCodesByEventId =
        invitationConfigApi.getTemplateCodesForEvents(eventIds);
    if (templateCodesByEventId.isEmpty()) {
      return response;
    }
    List<EventSummaryDto> enriched =
        items.stream()
            .map(
                item ->
                    new EventSummaryDto(
                        item.id(),
                        item.organizerId(),
                        item.eventType(),
                        item.title(),
                        item.eventDate(),
                        item.status(),
                        item.updatedAt(),
                        templateCodesByEventId.get(item.id())))
            .toList();
    PagedResponse<EventSummaryDto> page = response.page();
    return new PagedEventsResponse(
        new PagedResponse<>(
            enriched, page.page(), page.size(), page.total(), page.totalPages(), page.hasMore()));
  }

  private static void validateSort(Sort sort) {
    sort.forEach(
        order -> {
          if (!SORTABLE_PROPERTIES.contains(order.getProperty())) {
            throw new IllegalArgumentException(
                "Invalid sort property '"
                    + order.getProperty()
                    + "'. Allowed values: "
                    + SORTABLE_PROPERTIES);
          }
        });
  }

  @PatchMapping(path = "/{id}")
  @PreAuthorize(OWNER_EXPR)
  public EventDto updateMetadata(@PathVariable String id, @Valid @RequestBody UpdateEventDto body) {
    return eventApi.updateEventMetadata(id, body);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize(OWNER_EXPR)
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteEvent(@PathVariable String id) {
    eventApi.deleteEvent(id);
  }

  @PostMapping("/{id}/archive")
  @PreAuthorize(OWNER_EXPR)
  public EventDto archiveEvent(@PathVariable String id) {
    return eventApi.archiveEvent(id);
  }

  @PostMapping("/{id}/restore")
  @PreAuthorize(OWNER_EXPR)
  public EventDto restoreEvent(@PathVariable String id) {
    return eventApi.restoreEvent(id);
  }

  @PatchMapping(path = "/{id}/organizer")
  @PreAuthorize("hasRole('Administrator')")
  public EventDto reassignOrganizer(
      @PathVariable String id,
      @Valid @RequestBody ReassignOrganizerDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return eventApi.reassignOrganizer(id, body, jwt.getSubject());
  }

  // ----- Generic JSONB payloads (type-agnostic) -----

  @PutMapping(path = "/{id}/locations")
  @PreAuthorize(OWNER_EXPR)
  public EventDto updateLocations(
      @PathVariable String id, @Valid @RequestBody LocationsPayloadDto body) {
    return eventApi.updateLocations(id, body);
  }

  @PutMapping(path = "/{id}/program")
  @PreAuthorize(OWNER_EXPR)
  public EventDto updateProgram(
      @PathVariable String id, @Valid @RequestBody ProgramPayloadDto body) {
    return eventApi.updateProgram(id, body);
  }

  @PutMapping(path = "/{id}/contacts")
  @PreAuthorize(OWNER_EXPR)
  public EventDto updateContacts(
      @PathVariable String id, @Valid @RequestBody ContactsPayloadDto body) {
    return eventApi.updateContacts(id, body);
  }

  private static boolean isAdmin(Jwt jwt) {
    List<String> roles = jwt.getClaimAsStringList("roles");
    return roles != null && roles.contains(ADMIN);
  }
}
