package com.vineyards.deerPlanner.audit.inbound;

import com.vineyards.deerPlanner.audit.facade.AuditInPort;
import com.vineyards.deerPlanner.audit.facade.dto.AuditEntryDto;
import com.vineyards.deerPlanner.audit.facade.dto.EventActivitySummaryDto;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only audit queries. Two endpoints:
 *
 * <ul>
 *   <li>{@code GET /api/v1/events/{id}/activity} — paged history of every action on this event
 *   <li>{@code GET /api/v1/events/{id}/activity-summary} — quick-view snapshot (last edit, last
 *       guest capture, etc.)
 * </ul>
 *
 * <p>Authorisation mirrors the events module: any authenticated organizer or admin can query.
 * Filtering by {@code resource_type} is optional and scoped to a single event's history.
 */
@Slf4j
@RestController
@PrimaryAdapter
@RequiredArgsConstructor
@RequestMapping("/api/v1/events/{eventId}")
@PreAuthorize("hasAnyRole('EventOrganizer', 'Administrator')")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {

  private static final String OWNER_EXPR =
      "hasRole('Administrator') or @eventSecurity.isOwner(#eventId, authentication.name)";

  private final AuditInPort auditApi;

  @GetMapping("/activity")
  @PreAuthorize(OWNER_EXPR)
  public PagedResponse<AuditEntryDto> activity(
      @PathVariable String eventId,
      @RequestParam(required = false) String resourceType,
      // Default 10 keeps the overview card compact. The FE may override up to 50; anything beyond
      // that is rejected by Spring's default page-size cap to keep p95 latency bounded.
      @PageableDefault(size = 10, sort = "occurredAt", direction = Sort.Direction.DESC)
          Pageable pageable) {
    return auditApi.listForEvent(eventId, resourceType, pageable);
  }

  @GetMapping("/activity-summary")
  @PreAuthorize(OWNER_EXPR)
  public EventActivitySummaryDto activitySummary(@PathVariable String eventId) {
    return auditApi.summaryForEvent(eventId);
  }
}
