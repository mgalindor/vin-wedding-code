package com.vineyards.deerPlanner.audit.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vineyards.deerPlanner.audit.application.port.AuditOutPort;
import com.vineyards.deerPlanner.audit.domain.ActorKind;
import com.vineyards.deerPlanner.audit.domain.AuditEntry;
import com.vineyards.deerPlanner.events.facade.EventArchivedAuditedEvent;
import com.vineyards.deerPlanner.events.facade.EventCreatedAuditedEvent;
import com.vineyards.deerPlanner.events.facade.EventMetadataUpdatedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestCreatedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestGroupCreatedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestRsvpMarkedFromInvitationAuditedEvent;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Verifies that {@link AuditListener} translates each published audit event into the correct {@link
 * AuditEntry} shape and hands it to the {@link AuditOutPort}. The actor resolution is exercised
 * through {@link AuditActorResolver} (no SecurityContext → system actor).
 */
@ExtendWith(MockitoExtension.class)
class AuditListenerTest {

  @Mock AuditOutPort audit;
  @Mock AuditActorResolver actorResolver;

  AuditListener listener;

  @BeforeEach
  void setUp() {
    listener = new AuditListener(audit, actorResolver);
    lenient()
        .when(actorResolver.resolve())
        .thenReturn(AuditActorResolver.ResolvedActor.user("user-1"));
  }

  @Test
  void onEventCreated_persistsEntryWithEventResourceTypeAndDenormalizedEventId() {
    Instant now = Instant.parse("2026-08-26T10:00:00Z");
    listener.on(new EventCreatedAuditedEvent("evt-1", "wedding", "Maya & Luis", now));

    ArgumentCaptor<AuditEntry> captor = ArgumentCaptor.forClass(AuditEntry.class);
    verify(audit).append(captor.capture());
    AuditEntry entry = captor.getValue();

    assertThat(entry.getAction()).isEqualTo("event.created");
    assertThat(entry.getResourceType()).isEqualTo("event");
    assertThat(entry.getResourceId()).isEqualTo("evt-1");
    assertThat(entry.getEventId()).isEqualTo("evt-1");
    assertThat(entry.getActorUserId()).isEqualTo("user-1");
    assertThat(entry.getActorKind()).isEqualTo(ActorKind.user);
    assertThat(entry.getOccurredAt()).isEqualTo(now);
    assertThat(entry.getPayload()).containsEntry("eventType", "wedding");
    assertThat(entry.getPayload()).containsEntry("title", "Maya & Luis");
  }

  @Test
  void onEventArchived_persistsEntryWithEmptyPayload() {
    listener.on(new EventArchivedAuditedEvent("evt-1", Instant.now()));

    ArgumentCaptor<AuditEntry> captor = ArgumentCaptor.forClass(AuditEntry.class);
    verify(audit).append(captor.capture());
    AuditEntry entry = captor.getValue();

    assertThat(entry.getAction()).isEqualTo("event.archived");
    assertThat(entry.getResourceId()).isEqualTo("evt-1");
    assertThat(entry.getPayload()).isEmpty();
  }

  @Test
  void onEventMetadataUpdated_carriesChangedFields() {
    listener.on(
        new EventMetadataUpdatedAuditedEvent(
            "evt-1", List.of("title", "eventDate"), Instant.now()));

    ArgumentCaptor<AuditEntry> captor = ArgumentCaptor.forClass(AuditEntry.class);
    verify(audit).append(captor.capture());
    AuditEntry entry = captor.getValue();

    assertThat(entry.getAction()).isEqualTo("event.metadata_updated");
    assertThat(entry.getPayload()).containsEntry("changedFields", List.of("title", "eventDate"));
  }

  @Test
  void onGuestGroupCreated_carriesGuestsAddedAndPrimaryGuestId() {
    Instant now = Instant.parse("2026-08-26T11:00:00Z");
    listener.on(new GuestGroupCreatedAuditedEvent("evt-1", "grp-1", 5, "gst-1", now));

    ArgumentCaptor<AuditEntry> captor = ArgumentCaptor.forClass(AuditEntry.class);
    verify(audit).append(captor.capture());
    AuditEntry entry = captor.getValue();

    assertThat(entry.getAction()).isEqualTo("guest_group.created");
    assertThat(entry.getResourceType()).isEqualTo("guest_group");
    assertThat(entry.getResourceId()).isEqualTo("grp-1");
    assertThat(entry.getEventId()).isEqualTo("evt-1");
    assertThat(entry.getPayload()).containsEntry("guestsAdded", 5);
    assertThat(entry.getPayload()).containsEntry("primaryGuestId", "gst-1");
  }

  @Test
  void onGuestCreated_denormalizesEventId() {
    listener.on(new GuestCreatedAuditedEvent("evt-1", "gst-1", "grp-1", Instant.now()));

    ArgumentCaptor<AuditEntry> captor = ArgumentCaptor.forClass(AuditEntry.class);
    verify(audit).append(captor.capture());
    AuditEntry entry = captor.getValue();

    assertThat(entry.getAction()).isEqualTo("guest.created");
    assertThat(entry.getResourceType()).isEqualTo("guest");
    assertThat(entry.getResourceId()).isEqualTo("gst-1");
    assertThat(entry.getEventId()).isEqualTo("evt-1");
  }

  @Test
  void onGuestRsvpMarkedFromInvitation_usesInvitationActorKind() {
    when(actorResolver.invitation())
        .thenReturn(new AuditActorResolver.ResolvedActor(null, ActorKind.invitation));

    listener.on(
        new GuestRsvpMarkedFromInvitationAuditedEvent(
            "evt-1", "gst-1", "confirmed", Instant.now()));

    ArgumentCaptor<AuditEntry> captor = ArgumentCaptor.forClass(AuditEntry.class);
    verify(audit).append(captor.capture());
    AuditEntry entry = captor.getValue();

    assertThat(entry.getAction()).isEqualTo("guest.rsvp_marked_from_invitation");
    assertThat(entry.getActorKind()).isEqualTo(ActorKind.invitation);
    assertThat(entry.getActorUserId()).isNull();
    assertThat(entry.getPayload()).containsEntry("newStatus", "confirmed");
  }
}
