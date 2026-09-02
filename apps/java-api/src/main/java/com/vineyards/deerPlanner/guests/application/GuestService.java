package com.vineyards.deerPlanner.guests.application;

import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.guests.application.port.GuestGroupOutPort;
import com.vineyards.deerPlanner.guests.application.port.GuestOutPort;
import com.vineyards.deerPlanner.guests.domain.Guest;
import com.vineyards.deerPlanner.guests.domain.GuestGroup;
import com.vineyards.deerPlanner.guests.domain.GuestRelationship;
import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
import com.vineyards.deerPlanner.guests.facade.GuestInPort;
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
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
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

  // ============== Groups ==============

  @Override
  @Transactional(readOnly = true)
  public ListGuestGroupsResponse listGroups(String eventId, String actorUserId) {
    eventApi.getEvent(eventId, actorUserId);
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
    eventApi.getEvent(group.getEventId(), actorUserId);
    return toDto(group);
  }

  @Override
  @Transactional
  public GuestGroupDto createGroup(String eventId, CreateGuestGroupDto dto, String actorUserId) {
    eventApi.getEvent(eventId, actorUserId);

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

    String newId = UUID.randomUUID().toString();
    String token = UUID.randomUUID().toString();
    int displayOrder = dto.displayOrder() != null ? dto.displayOrder() : 0;
    Instant now = Instant.now();

    List<Guest> guests = persistInlineGuests(newId, inlineGuests, now);
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

    GuestGroup group =
        GuestGroup.builder()
            .id(newId)
            .eventId(eventId)
            .name(dto.name())
            .relationship(GuestRelationship.fromString(dto.relationship()))
            .sharedEmail(dto.sharedEmail())
            .sharedPhone(dto.sharedPhone())
            .primaryGuestId(primaryGuestId)
            .invitationToken(token)
            .displayOrder(displayOrder)
            .createdAt(now)
            .updatedAt(now)
            .build();
    GuestGroup saved = groupRepository.save(group);
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
              .id(UUID.randomUUID().toString())
              .groupId(groupId)
              .firstName(g.firstName())
              .lastName(g.lastName())
              .email(g.email())
              .phone(g.phone())
              .dietaryNotes(g.dietaryNotes())
              .invitationToken(UUID.randomUUID().toString())
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
    eventApi.getEvent(current.getEventId(), actorUserId);
    GuestGroup updated = applyGroupPatch(current, dto);
    return toDto(groupRepository.save(updated));
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
    eventApi.getEvent(current.getEventId(), actorUserId);
    // guests FK has deleteCascade — group children go with it.
    groupRepository.deleteById(groupId);
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
    eventApi.getEvent(current.getEventId(), actorUserId);
    String newToken = UUID.randomUUID().toString();
    GuestGroup saved = groupRepository.save(current.withToken(newToken));
    log.info("guest_group.token_regenerated groupId={} actorUserId={}", groupId, actorUserId);
    return toDto(saved);
  }

  @Override
  @Transactional
  public GuestGroupDto updatePrimaryGuest(
      String groupId, UpdateGuestGroupPrimaryDto dto, String actorUserId) {
    GuestGroup group = loadOwnedGroup(groupId, actorUserId);
    String newPrimaryId = dto.guestId();

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

    GuestGroup updated =
        group.toBuilder().primaryGuestId(newPrimaryId).updatedAt(Instant.now()).build();
    GuestGroup saved = groupRepository.save(updated);
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
    eventApi.getEvent(eventId, actorUserId);
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
      spec =
          spec.and(
              (root, query, cb) ->
                  cb.or(
                      cb.like(cb.lower(root.get("firstName")), pattern),
                      cb.like(cb.lower(root.get("lastName")), pattern)));
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
    eventApi.getEvent(eventId, actorUserId);
    groupRepository
        .findById(dto.groupId())
        .orElseThrow(
            () ->
                new ResourceNotFoundError(
                    "guest_group_not_found", "Guest group " + dto.groupId() + " not found"));
    String newId = UUID.randomUUID().toString();
    String token = UUID.randomUUID().toString();
    Instant now = Instant.now();
    Guest guest =
        Guest.builder()
            .id(newId)
            .groupId(dto.groupId())
            .firstName(dto.firstName())
            .lastName(dto.lastName())
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
    return toDto(guestRepository.save(updated));
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
    verifyGuestOwnership(current.getGroupId(), actorUserId);
    guestRepository.deleteById(guestId);
    log.info("guest.deleted guestId={} actorUserId={}", guestId, actorUserId);
  }

  @Override
  @Transactional
  public GuestDto changeGuestGroup(
      String eventId, String guestId, ChangeGuestGroupDto dto, String actorUserId) {
    eventApi.getEvent(eventId, actorUserId);
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
        groupRepository.save(cleared);
      }
    }

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
    eventApi.getEvent(group.getEventId(), actorUserId);
    return group;
  }

  private void verifyGuestOwnership(String groupId, String actorUserId) {
    GuestGroup group =
        groupRepository
            .findById(groupId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_group_not_found", "Guest group " + groupId + " not found"));
    eventApi.getEvent(group.getEventId(), actorUserId);
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

  private Guest applyGuestPatch(Guest current, UpdateGuestDto dto) {
    return current.toBuilder()
        .firstName(dto.firstName() != null ? dto.firstName() : current.getFirstName())
        .lastName(dto.lastName() != null ? dto.lastName() : current.getLastName())
        .email(dto.email() != null ? dto.email() : current.getEmail())
        .phone(dto.phone() != null ? dto.phone() : current.getPhone())
        .dietaryNotes(dto.dietaryNotes() != null ? dto.dietaryNotes() : current.getDietaryNotes())
        .updatedAt(Instant.now())
        .build();
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
        g.getFirstName(),
        g.getLastName(),
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
