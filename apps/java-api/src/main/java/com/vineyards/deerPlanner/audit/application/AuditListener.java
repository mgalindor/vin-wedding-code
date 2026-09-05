package com.vineyards.deerPlanner.audit.application;

import com.vineyards.deerPlanner.audit.application.port.AuditOutPort;
import com.vineyards.deerPlanner.audit.domain.ActorKind;
import com.vineyards.deerPlanner.audit.domain.AuditEntry;
import com.vineyards.deerPlanner.guests.facade.GuestGroupCreatedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestRsvpMarkedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestRsvpMarkedFromInvitationAuditedEvent;
import java.time.Instant;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditListener {

  private final AuditOutPort audit;
  private final AuditActorResolver actorResolver;

  // ----- events/ -----

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.EventCreatedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "event",
        "event.created",
        Map.of("eventType", e.eventType(), "title", e.title()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.EventMetadataUpdatedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "event",
        "event.metadata_updated",
        Map.of("changedFields", e.changedFields()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.EventDeletedAuditedEvent e) {
    persist(e.eventId(), e.eventId(), "event", "event.deleted", Map.of(), e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.EventArchivedAuditedEvent e) {
    persist(e.eventId(), e.eventId(), "event", "event.archived", Map.of(), e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.EventLocationsUpdatedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "event",
        "event.locations_updated",
        Map.of("count", e.locationCount()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.EventProgramUpdatedAuditedEvent e) {
    persist(e.eventId(), e.eventId(), "event", "event.program_updated", Map.of(), e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.EventContactsUpdatedAuditedEvent e) {
    persist(e.eventId(), e.eventId(), "event", "event.contacts_updated", Map.of(), e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.EventOrganizerReassignedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "event",
        "event.organizer_reassigned",
        Map.of("oldOrganizerId", e.oldOrganizerId(), "newOrganizerId", e.newOrganizerId()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.WeddingDetailUpdatedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "wedding_event",
        "wedding_event.detail_updated",
        Map.of("changedFields", e.changedFields()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.WeddingLandingUpdatedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "wedding_event",
        "wedding_event.landing_updated",
        Map.of(),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.WeddingStoryUpdatedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "wedding_event",
        "wedding_event.story_updated",
        Map.of(),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.WeddingDressCodeUpdatedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "wedding_event",
        "wedding_event.dress_code_updated",
        Map.of(),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.WeddingGiftRegistryUpdatedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "wedding_event",
        "wedding_event.gift_registry_updated",
        Map.of(),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.events.facade.WeddingParentsUpdatedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "wedding_event",
        "wedding_event.parents_updated",
        Map.of(),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(
      com.vineyards.deerPlanner.events.facade.WeddingAccommodationUpdatedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "wedding_event",
        "wedding_event.accommodation_updated",
        Map.of(),
        e.occurredAt());
  }

  // ----- guests/ -----

  @ApplicationModuleListener
  public void on(GuestGroupCreatedAuditedEvent e) {
    persist(
        e.groupId(),
        e.eventId(),
        "guest_group",
        "guest_group.created",
        Map.of("guestsAdded", e.guestsAdded(), "primaryGuestId", e.primaryGuestId()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.guests.facade.GuestGroupUpdatedAuditedEvent e) {
    persist(
        e.groupId(),
        e.eventId(),
        "guest_group",
        "guest_group.updated",
        Map.of("changedFields", e.changedFields()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.guests.facade.GuestGroupDeletedAuditedEvent e) {
    persist(
        e.groupId(),
        e.eventId(),
        "guest_group",
        "guest_group.deleted",
        Map.of("guestsRemoved", e.guestsRemoved()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.guests.facade.GuestGroupTokenRegeneratedAuditedEvent e) {
    persist(
        e.groupId(),
        e.eventId(),
        "guest_group",
        "guest_group.token_regenerated",
        Map.of(),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.guests.facade.GuestGroupPrimaryUpdatedAuditedEvent e) {
    persist(
        e.groupId(),
        e.eventId(),
        "guest_group",
        "guest_group.primary_updated",
        Map.of("oldPrimaryId", e.oldPrimaryId(), "newPrimaryId", e.newPrimaryId()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.guests.facade.GuestCreatedAuditedEvent e) {
    persist(e.guestId(), e.eventId(), "guest", "guest.created", Map.of(), e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.guests.facade.GuestUpdatedAuditedEvent e) {
    persist(
        e.guestId(),
        e.eventId(),
        "guest",
        "guest.updated",
        Map.of("changedFields", e.changedFields()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.guests.facade.GuestDeletedAuditedEvent e) {
    persist(e.guestId(), e.eventId(), "guest", "guest.deleted", Map.of(), e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.guests.facade.GuestGroupChangedAuditedEvent e) {
    persist(
        e.guestId(),
        e.eventId(),
        "guest",
        "guest.group_changed",
        Map.of("oldGroupId", e.oldGroupId(), "newGroupId", e.newGroupId()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.guests.facade.GuestGroupRsvpMarkedAuditedEvent e) {
    persist(
        e.groupId(),
        e.eventId(),
        "guest_group",
        "guest_group.rsvp_marked",
        Map.of("newStatus", e.newStatus(), "guestsAffected", e.guestsAffected()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(GuestRsvpMarkedAuditedEvent e) {
    persist(
        e.guestId(),
        e.eventId(),
        "guest",
        "guest.rsvp_marked",
        Map.of("newStatus", e.newStatus()),
        e.occurredAt());
  }

  /**
   * Public-flow RSVP has no authenticated user. The listener assigns a fixed {@link
   * ActorKind#invitation} so the entry is distinguishable from a user-driven RSVP.
   */
  @ApplicationModuleListener
  public void on(GuestRsvpMarkedFromInvitationAuditedEvent e) {
    AuditActorResolver.ResolvedActor actor = actorResolver.invitation();
    persistAs(
        actor,
        e.guestId(),
        e.eventId(),
        "guest",
        "guest.rsvp_marked_from_invitation",
        Map.of("newStatus", e.newStatus()),
        e.occurredAt());
  }

  // ----- identity/ -----

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.identity.facade.UserCreatedAuditedEvent e) {
    persist(
        e.userId(),
        null,
        "user",
        "user.created",
        Map.of("username", e.username(), "roles", e.roles()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.identity.facade.UserUpdatedAuditedEvent e) {
    persist(
        e.userId(),
        null,
        "user",
        "user.updated",
        Map.of("changedFields", e.changedFields(), "isSelf", e.isSelf()),
        e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.identity.facade.UserDisabledAuditedEvent e) {
    persist(e.userId(), null, "user", "user.disabled", Map.of(), e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.identity.facade.UserEnabledAuditedEvent e) {
    persist(e.userId(), null, "user", "user.enabled", Map.of(), e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.identity.facade.UserDeletedAuditedEvent e) {
    persist(e.userId(), null, "user", "user.deleted", Map.of(), e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.identity.facade.UserPasswordChangedAuditedEvent e) {
    persist(e.userId(), null, "user", "user.password_changed_self", Map.of(), e.occurredAt());
  }

  @ApplicationModuleListener
  public void on(com.vineyards.deerPlanner.identity.facade.UserLoggedInAuditedEvent e) {
    persist(e.userId(), null, "user", "user.logged_in", Map.of("roles", e.roles()), e.occurredAt());
  }

  // ----- invitation/ -----

  @ApplicationModuleListener
  public void on(
      com.vineyards.deerPlanner.invitation.facade.InvitationConfigUpdatedAuditedEvent e) {
    persist(
        e.eventId(),
        e.eventId(),
        "invitation_config",
        "invitation_config.updated",
        Map.of("activeBefore", e.activeBefore(), "activeAfter", e.activeAfter()),
        e.occurredAt());
  }

  // ----- Helpers -----

  void persist(
      String resourceId,
      String eventId,
      String resourceType,
      String action,
      Map<String, Object> payload,
      Instant occurredAt) {
    AuditActorResolver.ResolvedActor actor = actorResolver.resolve();
    persistAs(actor, resourceId, eventId, resourceType, action, payload, occurredAt);
  }

  void persistAs(
      AuditActorResolver.ResolvedActor actor,
      String resourceId,
      String eventId,
      String resourceType,
      String action,
      Map<String, Object> payload,
      Instant occurredAt) {
    try {
      AuditEntry entry =
          AuditEntry.builder()
              .occurredAt(occurredAt == null ? Instant.now() : occurredAt)
              .actorUserId(actor.userId())
              .actorKind(actor.kind())
              .action(action)
              .resourceType(resourceType)
              .resourceId(resourceId)
              .eventId(eventId)
              .payload(payload)
              .build();
      AuditEntry saved = audit.append(entry);
      log.info(
          "audit.persisted id={} action={} actor={} eventId={}",
          saved.getId(),
          action,
          actor.userId(),
          eventId);
    } catch (Exception ex) {
      // Audit must never fail the request — the business transaction has already committed.
      log.warn("audit.persist_failed action={} resourceId={}", action, resourceId, ex);
    }
  }
}
