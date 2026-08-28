package com.vineyards.deerPlanner.guests.application;

import com.vineyards.deerPlanner.events.facade.EventFacade;
import com.vineyards.deerPlanner.guests.application.port.GuestGroupRepository;
import com.vineyards.deerPlanner.guests.application.port.GuestRepository;
import com.vineyards.deerPlanner.guests.domain.Guest;
import com.vineyards.deerPlanner.guests.domain.GuestGroup;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
        GuestGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ResourceNotFoundError("guest_group_not_found", "Guest group " + groupId + " not found"));
        eventApi.getEvent(group.eventId(), actorUserId);
        return toDto(group);
    }

    @Override
    @Transactional
    public GuestGroupDto createGroup(String eventId, CreateGuestGroupDto dto, String actorUserId) {
        eventApi.getEvent(eventId, actorUserId);
        String newId = UUID.randomUUID().toString();
        String token = UUID.randomUUID().toString();
        int displayOrder = dto.displayOrder() != null ? dto.displayOrder() : 0;
        GuestGroup group = new GuestGroup(
            newId, eventId, dto.name(),
            Optional.ofNullable(dto.side()),
            GuestRelationship.fromString(dto.relationship()),
            Optional.ofNullable(dto.sharedEmail()),
            Optional.ofNullable(dto.sharedPhone()),
            Optional.empty(),
            token, displayOrder,
            OffsetDateTime.now(), OffsetDateTime.now()
        );
        GuestGroup saved = groupRepository.save(group);
        log.info("guest_group.created groupId={} eventId={} actorUserId={}", saved.id(), eventId, actorUserId);
        return toDto(saved);
    }

    @Override
    @Transactional
    public GuestGroupDto updateGroup(String groupId, UpdateGuestGroupDto dto, String actorUserId) {
        GuestGroup current = groupRepository.findById(groupId)
            .orElseThrow(() -> new ResourceNotFoundError("guest_group_not_found", "Guest group " + groupId + " not found"));
        eventApi.getEvent(current.eventId(), actorUserId);
        GuestGroup updated = applyGroupPatch(current, dto);
        return toDto(groupRepository.save(updated));
    }

    @Override
    @Transactional
    public void deleteGroup(String groupId, String actorUserId) {
        GuestGroup current = groupRepository.findById(groupId)
            .orElseThrow(() -> new ResourceNotFoundError("guest_group_not_found", "Guest group " + groupId + " not found"));
        eventApi.getEvent(current.eventId(), actorUserId);
        // guests FK has deleteCascade — group children go with it.
        groupRepository.deleteById(groupId);
        log.info("guest_group.deleted groupId={} actorUserId={}", groupId, actorUserId);
    }

    @Override
    @Transactional
    public GuestGroupDto regenerateGroupToken(String groupId, String actorUserId) {
        GuestGroup current = groupRepository.findById(groupId)
            .orElseThrow(() -> new ResourceNotFoundError("guest_group_not_found", "Guest group " + groupId + " not found"));
        eventApi.getEvent(current.eventId(), actorUserId);
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
        List<String> groupIds = groups.stream().map(GuestGroup::id).toList();
        List<Guest> guests = guestRepository.findByEventIdGroupIds(groupIds);
        List<GuestDto> items = guests.stream().map(GuestService::toDto).toList();
        return new ListGuestsResponse(items, items.size());
    }

    @Override
    @Transactional(readOnly = true)
    public GuestDto getGuest(String guestId, String actorUserId) {
        Guest guest = guestRepository.findById(guestId)
            .orElseThrow(() -> new ResourceNotFoundError("guest_not_found", "Guest " + guestId + " not found"));
        verifyGuestOwnership(guest.groupId(), actorUserId);
        return toDto(guest);
    }

    @Override
    @Transactional
    public GuestDto createGuest(String eventId, CreateGuestDto dto, String actorUserId) {
        eventApi.getEvent(eventId, actorUserId);
        groupRepository.findById(dto.groupId())
            .orElseThrow(() -> new ResourceNotFoundError("guest_group_not_found", "Guest group " + dto.groupId() + " not found"));
        String newId = UUID.randomUUID().toString();
        String token = UUID.randomUUID().toString();
        boolean primary = Boolean.TRUE.equals(dto.primary());
        Guest guest = new Guest(
            newId, dto.groupId(), dto.firstName(), dto.lastName(),
            Optional.ofNullable(dto.email()),
            Optional.ofNullable(dto.phone()),
            Optional.ofNullable(dto.dietaryNotes()),
            primary, token,
            RsvpStatus.pending, Optional.empty(), Optional.empty(), Optional.empty(),
            OffsetDateTime.now(), OffsetDateTime.now()
        );
        Guest saved = guestRepository.save(guest);
        log.info("guest.created guestId={} groupId={} actorUserId={}", saved.id(), dto.groupId(), actorUserId);
        return toDto(saved);
    }

    @Override
    @Transactional
    public GuestDto updateGuest(String guestId, UpdateGuestDto dto, String actorUserId) {
        Guest current = guestRepository.findById(guestId)
            .orElseThrow(() -> new ResourceNotFoundError("guest_not_found", "Guest " + guestId + " not found"));
        verifyGuestOwnership(current.groupId(), actorUserId);
        Guest updated = applyGuestPatch(current, dto);
        return toDto(guestRepository.save(updated));
    }

    @Override
    @Transactional
    public void deleteGuest(String guestId, String actorUserId) {
        Guest current = guestRepository.findById(guestId)
            .orElseThrow(() -> new ResourceNotFoundError("guest_not_found", "Guest " + guestId + " not found"));
        verifyGuestOwnership(current.groupId(), actorUserId);
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
        List<String> groupIds = groups.stream().map(GuestGroup::id).toList();
        return guestRepository.findByEventIdGroupIds(groupIds).stream()
            .map(GuestService::toDto)
            .toList();
    }

    // ============== helpers ==============

    private void verifyGuestOwnership(String groupId, String actorUserId) {
        GuestGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ResourceNotFoundError("guest_group_not_found", "Guest group " + groupId + " not found"));
        eventApi.getEvent(group.eventId(), actorUserId);
    }

    private GuestGroup applyGroupPatch(GuestGroup current, UpdateGuestGroupDto dto) {
        return new GuestGroup(
            current.id(),
            current.eventId(),
            dto.name() != null ? dto.name() : current.name(),
            dto.side() != null ? Optional.of(dto.side()) : current.side(),
            dto.relationship() != null ? GuestRelationship.fromString(dto.relationship()) : current.relationship(),
            dto.sharedEmail() != null ? Optional.of(dto.sharedEmail()) : current.sharedEmail(),
            dto.sharedPhone() != null ? Optional.of(dto.sharedPhone()) : current.sharedPhone(),
            current.primaryGuestId(),
            current.invitationToken(),
            dto.displayOrder() != null ? dto.displayOrder() : current.displayOrder(),
            current.createdAt(),
            OffsetDateTime.now()
        );
    }

    private Guest applyGuestPatch(Guest current, UpdateGuestDto dto) {
        return new Guest(
            current.id(),
            current.groupId(),
            dto.firstName() != null ? dto.firstName() : current.firstName(),
            dto.lastName() != null ? dto.lastName() : current.lastName(),
            dto.email() != null ? Optional.of(dto.email()) : current.email(),
            dto.phone() != null ? Optional.of(dto.phone()) : current.phone(),
            dto.dietaryNotes() != null ? Optional.of(dto.dietaryNotes()) : current.dietaryNotes(),
            dto.primary() != null ? dto.primary() : current.primary(),
            current.invitationToken(),
            current.rsvpStatus(),
            current.rsvpConfirmedAt(),
            current.rsvpMessage(),
            current.rsvpDietaryChoice(),
            current.createdAt(),
            OffsetDateTime.now()
        );
    }

    static GuestGroupDto toDto(GuestGroup g) {
        return new GuestGroupDto(
            g.id(), g.eventId(), g.name(), g.side().orElse(null),
            g.relationship().name(),
            g.sharedEmail().orElse(null), g.sharedPhone().orElse(null),
            g.primaryGuestId().orElse(null), g.invitationToken(),
            g.displayOrder(), g.createdAt(), g.updatedAt()
        );
    }

    static GuestDto toDto(Guest g) {
        return new GuestDto(
            g.id(), g.groupId(), g.firstName(), g.lastName(),
            g.email().orElse(null), g.phone().orElse(null), g.dietaryNotes().orElse(null),
            g.primary(), g.invitationToken(), g.rsvpStatus().name(),
            g.rsvpConfirmedAt().orElse(null), g.rsvpMessage().orElse(null),
            g.rsvpDietaryChoice().orElse(null),
            g.createdAt(), g.updatedAt()
        );
    }
}
