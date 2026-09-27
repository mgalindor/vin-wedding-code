package com.vineyards.deerPlanner.guests.application;

import com.github.shamil.Xid;
import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.guests.application.port.GuestGroupOutPort;
import com.vineyards.deerPlanner.guests.application.port.GuestOutPort;
import com.vineyards.deerPlanner.guests.domain.Guest;
import com.vineyards.deerPlanner.guests.domain.GuestGroup;
import com.vineyards.deerPlanner.guests.domain.GuestRelationship;
import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
import com.vineyards.deerPlanner.guests.facade.GuestCreatedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestDeletedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestGroupChangedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestGroupCreatedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestGroupDeletedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestGroupPrimaryUpdatedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestGroupRsvpMarkedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestGroupTokenRegeneratedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestInPort;
import com.vineyards.deerPlanner.guests.facade.GuestRsvpMarkedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestRsvpMarkedFromInvitationAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.GuestUpdatedAuditedEvent;
import com.vineyards.deerPlanner.guests.facade.dto.ChangeGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.InlineGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestGroupsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.RsvpUpdateDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupPrimaryDto;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class GuestService implements GuestInPort {

  private final GuestGroupOutPort groupRepository;
  private final GuestOutPort guestRepository;
  private final EventInPort eventApi;
  private final ApplicationEventPublisher publisher;

  @Override
  @Transactional(readOnly = true)
  public ListGuestGroupsResponse listGroups(String eventId, String actorUserId) {
    eventApi.getEvent(eventId);
    List<GuestGroup> groups = groupRepository.findByEventId(eventId);
    List<GuestGroupDto> items = groups.stream().map(GuestService::toDto).toList();
    return new ListGuestGroupsResponse(items, items.size());
  }

  @Override
  @Transactional(readOnly = true)
  public GuestGroupDto getGroup(String groupId, String actorUserId) {
    GuestGroup group =
        groupRepository
            .findById(groupId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_group_not_found", "Guest group " + groupId + " not found"));
    eventApi.getEvent(group.getEventId());
    return toDto(group);
  }

  @Override
  @Transactional
  public GuestGroupDto createGroup(String eventId, CreateGuestGroupDto dto, String actorUserId) {
    eventApi.getEvent(eventId);

    List<InlineGuestDto> inlineGuests = dto.guests() == null ? List.of() : dto.guests();
    if (inlineGuests.isEmpty()) {
      throw new BusinessError(
          "primary_guest_required",
          "A group must be created with at least one guest and one of them marked as primary");
    }

    // Exactly one inline guest must carry primary=true. The flag is a request hint only — it
    // tells the service which inline guest becomes the group's primaryGuestId. We validate
    // before persisting anything so a malformed request never leaves a half-written group.
    List<InlineGuestDto> markedPrimary =
        inlineGuests.stream().filter(g -> Boolean.TRUE.equals(g.primary())).toList();
    if (markedPrimary.isEmpty()) {
      throw new BusinessError(
          "primary_guest_required",
          "Exactly one inline guest must have primary=true so the group's primary contact can be"
              + " set");
    }
    if (markedPrimary.size() > 1) {
      throw new BusinessError(
          "multiple_primary_guests",
          "Only one inline guest may be marked primary=true; got " + markedPrimary.size());
    }

    String token = Xid.get().toString();
    int displayOrder = dto.displayOrder() != null ? dto.displayOrder() : 0;
    Instant now = Instant.now();

    GuestGroup group =
        GuestGroup.builder()
            .eventId(eventId)
            .name(dto.name())
            .relationship(GuestRelationship.fromString(dto.relationship()))
            .sharedEmail(dto.sharedEmail())
            .sharedPhone(dto.sharedPhone())
            .invitationToken(token)
            .displayOrder(displayOrder)
            .createdAt(now)
            .updatedAt(now)
            .build();
    GuestGroup savedGroup = groupRepository.create(group);

    List<Guest> guests = persistInlineGuests(savedGroup.getId(), inlineGuests, now);
    // Map back to the position marked as primary to find the persisted guest's id. The validation
    // above already guarantees exactly one such entry, so this lookup is safe.
    String primaryGuestId =
        guests.stream()
            .filter(g -> Boolean.TRUE.equals(inlineGuests.get(guests.indexOf(g)).primary()))
            .findFirst()
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "Primary guest lookup failed — validation should have rejected this"
                            + " earlier"))
            .getId();

    GuestGroup saved =
        groupRepository.update(savedGroup.toBuilder().primaryGuestId(primaryGuestId).build());
    publisher.publishEvent(
        new GuestGroupCreatedAuditedEvent(
            eventId, saved.getId(), guests.size(), primaryGuestId, now));
    log.info(
        "guest_group.created groupId={} eventId={} actorUserId={} guests={} primaryGuestId={}",
        saved.getId(),
        eventId,
        actorUserId,
        guests.size(),
        primaryGuestId);
    return toDto(saved);
  }

  /**
   * Builds and persists inline guests for a freshly-created group, returning the saved domains in
   * the same order as the input list. The caller is responsible for marking exactly one of the
   * inputs with {@code primary=true}; this method does not check, it just preserves order.
   */
  private List<Guest> persistInlineGuests(
      String groupId, List<InlineGuestDto> inlineGuests, Instant now) {
    List<Guest> saved = new ArrayList<>(inlineGuests.size());
    for (InlineGuestDto g : inlineGuests) {
      Guest guest =
          Guest.builder()
              .groupId(groupId)
              .fullName(g.fullName())
              .email(g.email())
              .phone(g.phone())
              .dietaryNotes(g.dietaryNotes())
              .invitationToken(Xid.get().toString())
              .rsvpStatus(RsvpStatus.pending)
              .rsvpConfirmedAt(null)
              .rsvpMessage(null)
              .rsvpDietaryChoice(null)
              .createdAt(now)
              .updatedAt(now)
              .build();
      saved.add(guestRepository.save(guest));
    }
    return saved;
  }

  @Override
  @Transactional
  public GuestGroupDto updateGroup(String groupId, UpdateGuestGroupDto dto, String actorUserId) {
    GuestGroup current =
        groupRepository
            .findById(groupId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_group_not_found", "Guest group " + groupId + " not found"));
    eventApi.getEvent(current.getEventId());
    GuestGroup updated = applyGroupPatch(current, dto);
    List<String> changed = detectChangedGroupFields(current, updated);
    if (changed.isEmpty()) {
      return toDto(updated);
    }
    GuestGroup saved = groupRepository.update(updated);
    publisher.publishEvent(
        new com.vineyards.deerPlanner.guests.facade.GuestGroupUpdatedAuditedEvent(
            saved.getEventId(), saved.getId(), changed, Instant.now()));
    return toDto(saved);
  }

  @Override
  @Transactional
  public void deleteGroup(String groupId, String actorUserId) {
    GuestGroup current =
        groupRepository
            .findById(groupId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_group_not_found", "Guest group " + groupId + " not found"));
    String eventId = current.getEventId();
    eventApi.getEvent(eventId);
    int removed = guestRepository.findByGroupId(groupId).size();
    // guests FK has deleteCascade — group children go with it.
    groupRepository.deleteById(groupId);
    publisher.publishEvent(
        new GuestGroupDeletedAuditedEvent(eventId, groupId, removed, Instant.now()));
    log.info("guest_group.deleted groupId={} actorUserId={}", groupId, actorUserId);
  }

  @Override
  @Transactional
  public GuestGroupDto regenerateGroupToken(String groupId, String actorUserId) {
    GuestGroup current =
        groupRepository
            .findById(groupId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_group_not_found", "Guest group " + groupId + " not found"));
    eventApi.getEvent(current.getEventId());
    String newToken = Xid.get().toString();
    GuestGroup saved = groupRepository.update(current.withToken(newToken));
    publisher.publishEvent(
        new GuestGroupTokenRegeneratedAuditedEvent(
            saved.getEventId(), saved.getId(), Instant.now()));
    log.info("guest_group.token_regenerated groupId={} actorUserId={}", groupId, actorUserId);
    return toDto(saved);
  }

  @Override
  @Transactional
  public GuestGroupDto updatePrimaryGuest(
      String groupId, UpdateGuestGroupPrimaryDto dto, String actorUserId) {
    GuestGroup group = loadOwnedGroup(groupId, actorUserId);
    String newPrimaryId = dto.guestId();
    String oldPrimaryId = group.getPrimaryGuestId();

    if (newPrimaryId != null) {
      Guest guest =
          guestRepository
              .findById(newPrimaryId)
              .orElseThrow(
                  () ->
                      new ResourceNotFoundError(
                          "guest_not_found", "Guest " + newPrimaryId + " not found"));
      if (!groupId.equals(guest.getGroupId())) {
        throw new BusinessError(
            "guest_not_in_group", "Guest " + newPrimaryId + " does not belong to group " + groupId);
      }
    }

    if (Objects.equals(oldPrimaryId, newPrimaryId)) {
      return toDto(group);
    }

    GuestGroup updated =
        group.toBuilder().primaryGuestId(newPrimaryId).updatedAt(Instant.now()).build();
    GuestGroup saved = groupRepository.update(updated);
    publisher.publishEvent(
        new GuestGroupPrimaryUpdatedAuditedEvent(
            saved.getEventId(), saved.getId(), oldPrimaryId, newPrimaryId, Instant.now()));
    log.info(
        "guest_group.primary_updated groupId={} primaryGuestId={} actorUserId={}",
        groupId,
        newPrimaryId,
        actorUserId);
    return toDto(saved);
  }

  // ============== Guests ==============

  @Override
  @Transactional(readOnly = true)
  public com.vineyards.deerPlanner.guests.facade.dto.PagedGuestsResponse listGuests(
      String eventId,
      String groupId,
      String rsvpStatus,
      String q,
      String actorUserId,
      org.springframework.data.domain.Pageable pageable) {
    eventApi.getEvent(eventId);
    List<GuestGroup> groups = groupRepository.findByEventId(eventId);
    org.springframework.data.jpa.domain.Specification<
            com.vineyards.deerPlanner.guests.outbound.GuestEntity>
        spec = org.springframework.data.jpa.domain.Specification.unrestricted();
    if (groupId != null && !groupId.isBlank()) {
      spec = spec.and((root, query, cb) -> cb.equal(root.get("groupId"), groupId));
    } else if (!groups.isEmpty()) {
      // No group filter but the event has groups — restrict to those.
      List<String> groupIds = groups.stream().map(GuestGroup::getId).toList();
      spec = spec.and((root, query, cb) -> root.get("groupId").in(groupIds));
    } else {
      // No groups at all — nothing to return.
      return new com.vineyards.deerPlanner.guests.facade.dto.PagedGuestsResponse(
          com.vineyards.deerPlanner.shared.web.PagedResponse.from(
              new org.springframework.data.domain.PageImpl<>(List.of()),
              e -> GuestService.toDto((com.vineyards.deerPlanner.guests.domain.Guest) e)));
    }
    if (rsvpStatus != null && !rsvpStatus.isBlank()) {
      spec = spec.and((root, query, cb) -> cb.equal(root.get("rsvpStatus"), rsvpStatus));
    }
    if (q != null && !q.isBlank()) {
      String pattern = "%" + q.toLowerCase().trim() + "%";
      spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("fullName")), pattern));
    }
    org.springframework.data.domain.Page<com.vineyards.deerPlanner.guests.domain.Guest> page =
        guestRepository.search(spec, pageable);
    return new com.vineyards.deerPlanner.guests.facade.dto.PagedGuestsResponse(
        com.vineyards.deerPlanner.shared.web.PagedResponse.from(page, GuestService::toDto));
  }

  @Override
  @Transactional(readOnly = true)
  public GuestDto getGuest(String guestId, String actorUserId) {
    Guest guest =
        guestRepository
            .findById(guestId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_not_found", "Guest " + guestId + " not found"));
    verifyGuestOwnership(guest.getGroupId(), actorUserId);
    return toDto(guest);
  }

  @Override
  @Transactional
  public GuestDto createGuest(String eventId, CreateGuestDto dto, String actorUserId) {
    eventApi.getEvent(eventId);
    GuestGroup group =
        groupRepository
            .findById(dto.groupId())
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_group_not_found", "Guest group " + dto.groupId() + " not found"));
    if (!eventId.equals(group.getEventId())) {
      throw new ResourceNotFoundError(
          "guest_group_not_found",
          "Guest group " + dto.groupId() + " not found in event " + eventId);
    }
    String token = Xid.get().toString();
    Instant now = Instant.now();
    Guest guest =
        Guest.builder()
            .groupId(dto.groupId())
            .fullName(dto.fullName())
            .email(dto.email())
            .phone(dto.phone())
            .dietaryNotes(dto.dietaryNotes())
            .invitationToken(token)
            .rsvpStatus(RsvpStatus.pending)
            .rsvpConfirmedAt(null)
            .rsvpMessage(null)
            .rsvpDietaryChoice(null)
            .createdAt(now)
            .updatedAt(now)
            .build();
    Guest saved = guestRepository.save(guest);
    publisher.publishEvent(
        new GuestCreatedAuditedEvent(eventId, saved.getId(), saved.getGroupId(), now));
    log.info(
        "guest.created guestId={} groupId={} actorUserId={}",
        saved.getId(),
        dto.groupId(),
        actorUserId);
    return toDto(saved);
  }

  @Override
  @Transactional
  public GuestDto updateGuest(String guestId, UpdateGuestDto dto, String actorUserId) {
    Guest current =
        guestRepository
            .findById(guestId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_not_found", "Guest " + guestId + " not found"));
    verifyGuestOwnership(current.getGroupId(), actorUserId);
    Guest updated = applyGuestPatch(current, dto);
    List<String> changed = detectChangedGuestFields(current, updated);
    if (changed.isEmpty()) {
      return toDto(updated);
    }
    Guest saved = guestRepository.save(updated);
    String eventId = resolveEventIdForGuest(saved.getGroupId());
    publisher.publishEvent(
        new GuestUpdatedAuditedEvent(eventId, saved.getId(), changed, Instant.now()));
    return toDto(saved);
  }

  @Override
  @Transactional
  public void deleteGuest(String guestId, String actorUserId) {
    Guest current =
        guestRepository
            .findById(guestId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_not_found", "Guest " + guestId + " not found"));
    String eventId = resolveEventIdForGuest(current.getGroupId());
    verifyGuestOwnership(current.getGroupId(), actorUserId);
    guestRepository.deleteById(guestId);
    publisher.publishEvent(new GuestDeletedAuditedEvent(eventId, guestId, Instant.now()));
    log.info("guest.deleted guestId={} actorUserId={}", guestId, actorUserId);
  }

  @Override
  @Transactional
  public GuestDto changeGuestGroup(
      String eventId, String guestId, ChangeGuestGroupDto dto, String actorUserId) {
    eventApi.getEvent(eventId);
    Guest current =
        guestRepository
            .findById(guestId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_not_found", "Guest " + guestId + " not found"));

    String oldGroupId = current.getGroupId();
    String newGroupId = dto.groupId();

    // Validate the current group belongs to the event in the path. Without this guard a user
    // could PATCH a guest from a different event just by knowing its id.
    if (oldGroupId != null) {
      GuestGroup oldGroup =
          groupRepository
              .findById(oldGroupId)
              .orElseThrow(
                  () ->
                      new ResourceNotFoundError(
                          "guest_group_not_found", "Guest group " + oldGroupId + " not found"));
      if (!eventId.equals(oldGroup.getEventId())) {
        throw new ResourceNotFoundError(
            "guest_not_found", "Guest " + guestId + " not found in event " + eventId);
      }
    }

    // Validate the target group exists and belongs to the same event.
    if (newGroupId != null) {
      GuestGroup newGroup =
          groupRepository
              .findById(newGroupId)
              .orElseThrow(
                  () ->
                      new ResourceNotFoundError(
                          "guest_group_not_found", "Guest group " + newGroupId + " not found"));
      if (!eventId.equals(newGroup.getEventId())) {
        throw new ResourceNotFoundError(
            "guest_group_not_found",
            "Guest group " + newGroupId + " not found in event " + eventId);
      }
    }

    if (Objects.equals(oldGroupId, newGroupId)) {
      // No-op: already in the requested group (or already unassigned).
      return toDto(current);
    }

    Guest updated = current.toBuilder().groupId(newGroupId).updatedAt(Instant.now()).build();
    Guest saved = guestRepository.save(updated);

    // If the guest was the primary of the old group, clear the dangling reference.
    if (oldGroupId != null) {
      GuestGroup oldGroup = groupRepository.findById(oldGroupId).orElse(null);
      if (oldGroup != null && guestId.equals(oldGroup.getPrimaryGuestId())) {
        GuestGroup cleared =
            oldGroup.toBuilder().primaryGuestId(null).updatedAt(Instant.now()).build();
        groupRepository.update(cleared);
      }
    }

    publisher.publishEvent(
        new GuestGroupChangedAuditedEvent(eventId, guestId, oldGroupId, newGroupId, Instant.now()));
    log.info(
        "guest.group_changed guestId={} oldGroupId={} newGroupId={} actorUserId={}",
        guestId,
        oldGroupId,
        newGroupId,
        actorUserId);
    return toDto(saved);
  }

  // ============== Admin RSVP ==============

  @Override
  @Transactional
  public GuestGroupDto markGroupRsvp(String groupId, RsvpUpdateDto dto, String actorUserId) {
    GuestGroup group = loadOwnedGroup(groupId, actorUserId);
    List<Guest> guests = guestRepository.findByGroupId(groupId);
    Instant now = Instant.now();
    for (Guest guest : guests) {
      Guest updated = applyRsvpPatch(guest, dto, now);
      guestRepository.save(updated);
    }
    publisher.publishEvent(
        new GuestGroupRsvpMarkedAuditedEvent(
            group.getEventId(), groupId, dto.status().name(), guests.size(), now));
    log.info(
        "guest_group.rsvp_marked groupId={} status={} actorUserId={} guestsAffected={}",
        groupId,
        dto.status(),
        actorUserId,
        guests.size());
    return toDto(group);
  }

  @Override
  @Transactional
  public GuestDto markGuestRsvp(String guestId, RsvpUpdateDto dto, String actorUserId) {
    Guest current = loadOwnedGuest(guestId, actorUserId);
    Guest updated = applyRsvpPatch(current, dto, Instant.now());
    Guest saved = guestRepository.save(updated);
    String eventId = resolveEventIdForGuest(saved.getGroupId());
    publisher.publishEvent(
        new GuestRsvpMarkedAuditedEvent(
            eventId, saved.getId(), dto.status().name(), Instant.now()));
    log.info(
        "guest.rsvp_marked guestId={} status={} actorUserId={}",
        guestId,
        dto.status(),
        actorUserId);
    return toDto(saved);
  }

  // ============== Public RSVP (called from invitation module) ==============

  @Override
  @Transactional
  public GuestDto applyRsvpFromInvitation(String guestId, RsvpUpdateDto dto) {
    Guest current =
        guestRepository
            .findById(guestId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_not_found", "Guest " + guestId + " not found"));
    Guest updated = applyRsvpPatch(current, dto, Instant.now());
    Guest saved = guestRepository.save(updated);
    String eventId = resolveEventIdForGuest(saved.getGroupId());
    publisher.publishEvent(
        new GuestRsvpMarkedFromInvitationAuditedEvent(
            eventId, saved.getId(), dto.status().name(), Instant.now()));
    log.info("guest.rsvp_marked_from_invitation guestId={} status={}", guestId, dto.status());
    return toDto(saved);
  }

  // ============== Cross-context reads ==============

  @Override
  @Transactional(readOnly = true)
  public List<GuestDto> findAllForEvent(String eventId) {
    List<GuestGroup> groups = groupRepository.findByEventId(eventId);
    if (groups.isEmpty()) {
      return List.of();
    }
    List<String> groupIds = groups.stream().map(GuestGroup::getId).toList();
    return guestRepository.findByEventIdGroupIds(groupIds).stream()
        .map(GuestService::toDto)
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<GuestDto> listGuestsByGroupId(String groupId) {
    return guestRepository.findByGroupId(groupId).stream().map(GuestService::toDto).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<GuestGroupDto> findGroupByInvitationToken(String token) {
    return groupRepository.findByInvitationToken(token).map(GuestService::toDto);
  }

  // ============== helpers ==============

  private Guest loadOwnedGuest(String guestId, String actorUserId) {
    Guest guest =
        guestRepository
            .findById(guestId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_not_found", "Guest " + guestId + " not found"));
    verifyGuestOwnership(guest.getGroupId(), actorUserId);
    return guest;
  }

  private GuestGroup loadOwnedGroup(String groupId, String actorUserId) {
    GuestGroup group =
        groupRepository
            .findById(groupId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_group_not_found", "Guest group " + groupId + " not found"));
    eventApi.getEvent(group.getEventId());
    return group;
  }

  private void verifyGuestOwnership(String groupId, String actorUserId) {
    // An unassigned guest (groupId == null, e.g. after changeGuestGroup(null)) has no group to
    // resolve an event through. groupRepository.findById(null) would throw
    // InvalidDataAccessApiUsageException (unhandled -> 500) instead of a clean result, so treat
    // "no group" as "nothing further to verify" — the controller-level @PreAuthorize already
    // requires EventOrganizer/Administrator, and the guest's existence was already confirmed by
    // the caller.
    if (groupId == null) {
      return;
    }
    GuestGroup group =
        groupRepository
            .findById(groupId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_group_not_found", "Guest group " + groupId + " not found"));
    eventApi.getEvent(group.getEventId());
  }

  private String resolveEventIdForGuest(String groupId) {
    if (groupId == null) return null;
    return groupRepository.findById(groupId).map(GuestGroup::getEventId).orElse(null);
  }

  private GuestGroup applyGroupPatch(GuestGroup current, UpdateGuestGroupDto dto) {
    return current.toBuilder()
        .name(dto.name() != null ? dto.name() : current.getName())
        .relationship(
            dto.relationship() != null
                ? GuestRelationship.fromString(dto.relationship())
                : current.getRelationship())
        .sharedEmail(dto.sharedEmail() != null ? dto.sharedEmail() : current.getSharedEmail())
        .sharedPhone(dto.sharedPhone() != null ? dto.sharedPhone() : current.getSharedPhone())
        .displayOrder(dto.displayOrder() != null ? dto.displayOrder() : current.getDisplayOrder())
        .updatedAt(Instant.now())
        .build();
  }

  private static List<String> detectChangedGroupFields(GuestGroup before, GuestGroup after) {
    List<String> changed = new ArrayList<>();
    if (!Objects.equals(before.getName(), after.getName())) changed.add("name");
    if (before.getRelationship() != after.getRelationship()) changed.add("relationship");
    if (!Objects.equals(before.getSharedEmail(), after.getSharedEmail()))
      changed.add("sharedEmail");
    if (!Objects.equals(before.getSharedPhone(), after.getSharedPhone()))
      changed.add("sharedPhone");
    if (before.getDisplayOrder() != after.getDisplayOrder()) changed.add("displayOrder");
    return changed;
  }

  private Guest applyGuestPatch(Guest current, UpdateGuestDto dto) {
    return current.toBuilder()
        .fullName(dto.fullName() != null ? dto.fullName() : current.getFullName())
        .email(dto.email() != null ? dto.email() : current.getEmail())
        .phone(dto.phone() != null ? dto.phone() : current.getPhone())
        .dietaryNotes(dto.dietaryNotes() != null ? dto.dietaryNotes() : current.getDietaryNotes())
        .updatedAt(Instant.now())
        .build();
  }

  private static List<String> detectChangedGuestFields(Guest before, Guest after) {
    List<String> changed = new ArrayList<>();
    if (!Objects.equals(before.getFullName(), after.getFullName())) changed.add("fullName");
    if (!Objects.equals(before.getEmail(), after.getEmail())) changed.add("email");
    if (!Objects.equals(before.getPhone(), after.getPhone())) changed.add("phone");
    if (!Objects.equals(before.getDietaryNotes(), after.getDietaryNotes()))
      changed.add("dietaryNotes");
    return changed;
  }

  private Guest applyRsvpPatch(Guest current, RsvpUpdateDto dto, Instant now) {
    return current.toBuilder()
        .rsvpStatus(dto.status())
        .rsvpConfirmedAt(dto.status() == RsvpStatus.pending ? null : now)
        .rsvpMessage(dto.message())
        .updatedAt(now)
        .build();
  }

  static GuestGroupDto toDto(GuestGroup g) {
    return new GuestGroupDto(
        g.getId(),
        g.getEventId(),
        g.getName(),
        g.getRelationship().name(),
        g.getSharedEmail(),
        g.getSharedPhone(),
        g.getPrimaryGuestId(),
        g.getInvitationToken(),
        g.getDisplayOrder(),
        g.getCreatedAt(),
        g.getUpdatedAt());
  }

  static GuestDto toDto(Guest g) {
    return new GuestDto(
        g.getId(),
        g.getGroupId(),
        g.getFullName(),
        g.getEmail(),
        g.getPhone(),
        g.getDietaryNotes(),
        g.getInvitationToken(),
        g.getRsvpStatus().name(),
        g.getRsvpConfirmedAt(),
        g.getRsvpMessage(),
        g.getRsvpDietaryChoice(),
        g.getCreatedAt(),
        g.getUpdatedAt());
  }
}
