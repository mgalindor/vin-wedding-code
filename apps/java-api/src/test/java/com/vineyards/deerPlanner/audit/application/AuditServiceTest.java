package com.vineyards.deerPlanner.audit.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.vineyards.deerPlanner.audit.application.port.AuditOutPort;
import com.vineyards.deerPlanner.audit.domain.ActorKind;
import com.vineyards.deerPlanner.audit.domain.AuditEntry;
import com.vineyards.deerPlanner.audit.facade.dto.AuditEntryDto;
import com.vineyards.deerPlanner.audit.facade.dto.EventActivitySummaryDto;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

  @Mock AuditOutPort audit;

  AuditService service;

  @BeforeEach
  void setUp() {
    service = new AuditService(audit);
  }

  @Test
  void listForEvent_mapsPageToDtos() {
    AuditEntry e =
        sampleEntry("aud-1", "evt-1", "user-1", "event", "event.created", Map.of("k", "v"));
    Page<AuditEntry> page = new PageImpl<>(List.of(e), PageRequest.of(0, 20), 1);
    when(audit.findByEventId(eq("evt-1"), eq(null), any(Pageable.class))).thenReturn(page);

    PagedResponse<AuditEntryDto> result =
        service.listForEvent("evt-1", null, PageRequest.of(0, 20));

    assertThat(result.items()).hasSize(1);
    AuditEntryDto dto = result.items().get(0);
    assertThat(dto.id()).isEqualTo("aud-1");
    assertThat(dto.action()).isEqualTo("event.created");
    assertThat(dto.actorKind()).isEqualTo("user");
  }

  @Test
  void summaryForEvent_aggregatesFromThreeSources() {
    AuditEntry created = sampleEntry("aud-1", "evt-1", "alice", "event", "event.created", Map.of());
    AuditEntry updated =
        sampleEntry(
            "aud-2",
            "evt-1",
            "bob",
            "event",
            "event.metadata_updated",
            Map.of("changedFields", List.of("title")));
    AuditEntry guestsAdded =
        sampleEntry(
            "aud-3",
            "evt-1",
            "alice",
            "guest_group",
            "guest_group.created",
            Map.of("guestsAdded", 4, "primaryGuestId", "gst-1"));

    when(audit.findLatestByEventIdAndAction("evt-1", "event.created"))
        .thenReturn(Optional.of(created));
    when(audit.findByEventId(eq("evt-1"), eq(null), any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of(updated), Pageable.ofSize(1), 1));
    when(audit.findGuestCaptureActions(eq("evt-1"))).thenReturn(List.of(guestsAdded));

    EventActivitySummaryDto summary = service.summaryForEvent("evt-1");

    assertThat(summary.eventId()).isEqualTo("evt-1");
    assertThat(summary.createdBy()).isEqualTo("alice");
    assertThat(summary.createdAt()).isNotNull();
    assertThat(summary.lastActorUserId()).isEqualTo("bob");
    assertThat(summary.lastAction()).isEqualTo("event.metadata_updated");
    assertThat(summary.lastGuestCaptureCount()).isEqualTo(4);
    assertThat(summary.lastGuestCaptureAt()).isNotNull();
  }

  @Test
  void summaryForEvent_withNoActivity_returnsZeroedSummary() {
    when(audit.findLatestByEventIdAndAction("evt-empty", "event.created"))
        .thenReturn(Optional.empty());
    when(audit.findByEventId(eq("evt-empty"), eq(null), any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of()));
    when(audit.findGuestCaptureActions("evt-empty")).thenReturn(List.of());

    EventActivitySummaryDto summary = service.summaryForEvent("evt-empty");

    assertThat(summary.eventId()).isEqualTo("evt-empty");
    assertThat(summary.createdBy()).isNull();
    assertThat(summary.lastActorUserId()).isNull();
    assertThat(summary.lastAction()).isNull();
    assertThat(summary.lastGuestCaptureCount()).isZero();
  }

  private static AuditEntry sampleEntry(
      String id,
      String eventId,
      String actorUserId,
      String resourceType,
      String action,
      Map<String, Object> payload) {
    return AuditEntry.builder()
        .id(id)
        .occurredAt(Instant.now())
        .actorUserId(actorUserId)
        .actorKind(ActorKind.user)
        .action(action)
        .resourceType(resourceType)
        .resourceId(id)
        .eventId(eventId)
        .payload(payload)
        .build();
  }
}
