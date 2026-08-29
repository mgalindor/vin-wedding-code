package com.vineyards.deerPlanner.guests.application;

import com.vineyards.deerPlanner.events.facade.EventFacade;
import com.vineyards.deerPlanner.guests.application.port.GuestGroupRepository;
import com.vineyards.deerPlanner.guests.application.port.GuestRepository;
import com.vineyards.deerPlanner.guests.domain.Guest;
import com.vineyards.deerPlanner.guests.domain.GuestGroup;
import com.vineyards.deerPlanner.guests.domain.GuestRelationship;
import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
import com.vineyards.deerPlanner.guests.facade.GuestFacade;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestGroupsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupDto;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import java.time.OffsetDateTime;
import java.util.List;
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
public class GuestService implements GuestFacade {

  private final GuestGroupRepository groupRepository;
  private final GuestRepository guestRepository;
  private final EventFacade eventApi;

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
    GuestGroup group =
        GuestGroup.builder()
            .id(newId)
            .eventId(eventId)
            .name(dto.name())
            .side(Optional.ofNullable(dto.side()))
            .relationship(GuestRelationship.fromString(dto.relationship()))
            .sharedEmail(Optional.ofNullable(dto.sharedEmail()))
            .sharedPhone(Optional.ofNullable(dto.sharedPhone()))
            .primaryGuestId(Optional.empty())
            .invitationToken(token)
            .displayOrder(displayOrder)
            .createdAt(OffsetDateTime.now())
            .updatedAt(OffsetDateTime.now())
            .build();
    GuestGroup saved = groupRepository.save(group);
    log.info(
        "guest_group.created groupId={} eventId={} actorUserId={}",
        saved.getId(),
        eventId,
        actorUserId);
    return toDto(saved);
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
    Guest guest =
        Guest.builder()
            .id(newId)
            .groupId(dto.groupId())
            .firstName(dto.firstName())
            .lastName(dto.lastName())
            .email(Optional.ofNullable(dto.email()))
            .phone(Optional.ofNullable(dto.phone()))
            .dietaryNotes(Optional.ofNullable(dto.dietaryNotes()))
            .primary(primary)
            .invitationToken(token)
            .rsvpStatus(RsvpStatus.pending)
            .rsvpConfirmedAt(Optional.empty())
            .rsvpMessage(Optional.empty())
            .rsvpDietaryChoice(Optional.empty())
            .createdAt(OffsetDateTime.now())
            .updatedAt(OffsetDateTime.now())
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
        .side(dto.side() != null ? Optional.of(dto.side()) : current.getSide())
        .relationship(
            dto.relationship() != null
                ? GuestRelationship.fromString(dto.relationship())
                : current.getRelationship())
        .sharedEmail(
            dto.sharedEmail() != null ? Optional.of(dto.sharedEmail()) : current.getSharedEmail())
        .sharedPhone(
            dto.sharedPhone() != null ? Optional.of(dto.sharedPhone()) : current.getSharedPhone())
        .displayOrder(dto.displayOrder() != null ? dto.displayOrder() : current.getDisplayOrder())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  private Guest applyGuestPatch(Guest current, UpdateGuestDto dto) {
    return current.toBuilder()
        .firstName(dto.firstName() != null ? dto.firstName() : current.getFirstName())
        .lastName(dto.lastName() != null ? dto.lastName() : current.getLastName())
        .email(dto.email() != null ? Optional.of(dto.email()) : current.getEmail())
        .phone(dto.phone() != null ? Optional.of(dto.phone()) : current.getPhone())
        .dietaryNotes(
            dto.dietaryNotes() != null
                ? Optional.of(dto.dietaryNotes())
                : current.getDietaryNotes())
        .primary(dto.primary() != null ? dto.primary() : current.isPrimary())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  static GuestGroupDto toDto(GuestGroup g) {
    return new GuestGroupDto(
        g.getId(),
        g.getEventId(),
        g.getName(),
        g.getSide().orElse(null),
        g.getRelationship().name(),
        g.getSharedEmail().orElse(null),
        g.getSharedPhone().orElse(null),
        g.getPrimaryGuestId().orElse(null),
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
        g.getEmail().orElse(null),
        g.getPhone().orElse(null),
        g.getDietaryNotes().orElse(null),
        g.isPrimary(),
        g.getInvitationToken(),
        g.getRsvpStatus().name(),
        g.getRsvpConfirmedAt().orElse(null),
        g.getRsvpMessage().orElse(null),
        g.getRsvpDietaryChoice().orElse(null),
        g.getCreatedAt(),
        g.getUpdatedAt());
  }
}
