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
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupDto;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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
    String newId = UUID.randomUUID().toString();
    String token = UUID.randomUUID().toString();
    int displayOrder = dto.displayOrder() != null ? dto.displayOrder() : 0;
    Instant now = Instant.now();

    List<InlineGuestDto> inlineGuests = dto.guests() == null ? List.of() : dto.guests();
    List<Guest> guests = persistInlineGuests(newId, inlineGuests, now);
    String primaryGuestId = pickPrimaryGuestId(guests);

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

  /** Builds and persists inline guests for a freshly-created group, returning the saved domains. */
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
              .primary(Boolean.TRUE.equals(g.primary()))
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

  /**
   * Picks the primary guest: first one marked primary, otherwise the first guest, otherwise null.
   */
  private String pickPrimaryGuestId(List<Guest> guests) {
    if (guests.isEmpty()) {
      return null;
    }
    return guests.stream()
        .filter(Guest::isPrimary)
        .map(Guest::getId)
        .findFirst()
        .orElseGet(() -> guests.get(0).getId());
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
    // guests FK has deleteCascade â€” group children go with it.
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

  // ============== Guests ==============

  @Override
  @Transactional(readOnly = true)
  public ListGuestsResponse listGuests(String eventId, String actorUserId) {
    eventApi.getEvent(eventId, actorUserId);
    List<GuestGroup> groups = groupRepository.findByEventId(eventId);
    if (groups.isEmpty()) {
      return new ListGuestsResponse(List.of(), 0);
    }
    List<String> groupIds = groups.stream().map(GuestGroup::getId).toList();
    List<Guest> guests = guestRepository.findByEventIdGroupIds(groupIds);
    List<GuestDto> items = guests.stream().map(GuestService::toDto).toList();
    return new ListGuestsResponse(items, items.size());
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
    boolean primary = Boolean.TRUE.equals(dto.primary());
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
            .primary(primary)
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

    if (java.util.Objects.equals(oldGroupId, newGroupId)) {
      // No-op: already in the requested group (or already unassigned).
      return toDto(current);
    }

    Guest updated = current.toBuilder().groupId(newGroupId).updatedAt(Instant.now()).build();
    Guest saved = guestRepository.save(updated);

    // If the guest was the primary of the old group, clear the dangling reference. We do NOT
    // auto-promote the moved guest to primary of the new group: the caller can use
    // PATCH /guests/{id} with { "primary": true } if they want that.
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

  // ============== helpers ==============

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
        .primary(dto.primary() != null ? dto.primary() : current.isPrimary())
        .updatedAt(Instant.now())
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
        g.isPrimary(),
        g.getInvitationToken(),
        g.getRsvpStatus().name(),
        g.getRsvpConfirmedAt(),
        g.getRsvpMessage(),
        g.getRsvpDietaryChoice(),
        g.getCreatedAt(),
        g.getUpdatedAt());
  }
}
