package com.vineyards.deerPlanner.invitation.application;

import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.events.facade.WeddingEventInPort;
import com.vineyards.deerPlanner.guests.facade.GuestInPort;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.RsvpUpdateDto;
import com.vineyards.deerPlanner.invitation.application.port.EventInvitationConfigOutPort;
import com.vineyards.deerPlanner.invitation.application.port.InvitationTemplateOutPort;
import com.vineyards.deerPlanner.invitation.domain.EventInvitationConfig;
import com.vineyards.deerPlanner.invitation.facade.PublicInvitationInPort;
import com.vineyards.deerPlanner.invitation.facade.dto.InvitationTemplateDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicGroupRsvpRequestDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicGroupViewDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicInvitationDto;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Public invitation surface. No caller identity — the {@code slug} is the token for the event
 * landing page; the {@code groupToken} is the credential for the per-group RSVP page. Cross-module
 * dependency: imports the {@code guests} module to persist RSVPs.
 */
@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class PublicInvitationService implements PublicInvitationInPort {

  private final EventInvitationConfigOutPort configRepository;
  private final InvitationTemplateOutPort templateRepository;
  private final EventInPort eventApi;
  private final WeddingEventInPort weddingEventApi;
  private final GuestInPort guestApi;

  // ============== Event-level landing page ==============

  @Override
  @Transactional(readOnly = true)
  public PublicInvitationDto getBySlug(String slug) {
    EventInvitationConfig config = loadActiveConfig(slug);

    var event =
        eventApi
            .findByEventId(config.getEventId())
            .orElseThrow(
                () ->
                    new BusinessError(
                        "event_missing",
                        "Underlying event for invitation " + slug + " was deleted"));

    InvitationTemplateDto template =
        config.getTemplateId() == null
            ? null
            : templateRepository
                .findById(config.getTemplateId())
                .map(InvitationTemplateService::toDto)
                .orElse(null);

    // Wedding detail is optional — null for non-wedding events and when the organizer
    // hasn't configured the wedding yet. The public page renders accordingly.
    var wedding = weddingEventApi.findByEventId(config.getEventId()).orElse(null);

    return new PublicInvitationDto(
        config.getSlug(), config.isActive(), config.isRsvpEnabled(), event, template, wedding);
  }

  // ============== Group-level RSVP page ==============

  @Override
  @Transactional(readOnly = true)
  public PublicGroupViewDto getGroup(String slug, String groupToken) {
    EventInvitationConfig config = loadActiveConfig(slug);
    GuestGroupDto group = loadGroupForEvent(config.getEventId(), groupToken);
    List<GuestDto> guests = guestApi.listGuestsByGroupId(group.id());
    return new PublicGroupViewDto(slug, group, guests);
  }

  @Override
  @Transactional
  public PublicGroupViewDto submitGroupRsvp(
      String slug, String groupToken, PublicGroupRsvpRequestDto dto) {
    EventInvitationConfig config = loadActiveConfig(slug);

    if (!config.isRsvpEnabled()) {
      throw new BusinessError("rsvp_disabled", "RSVP is disabled for this invitation");
    }
    if (config.getRsvpDeadline() != null
        && LocalDate.now(ZoneOffset.UTC).isAfter(config.getRsvpDeadline())) {
      throw new BusinessError("rsvp_deadline_passed", "RSVP deadline has passed");
    }

    GuestGroupDto group = loadGroupForEvent(config.getEventId(), groupToken);

    // Validate every guestId in the body belongs to this group — fail fast before any write.
    List<GuestDto> currentGuests = guestApi.listGuestsByGroupId(group.id());
    Set<String> validGuestIds = new HashSet<>(currentGuests.size());
    for (GuestDto g : currentGuests) {
      validGuestIds.add(g.id());
    }
    for (PublicGroupRsvpRequestDto.Entry entry : dto.guests()) {
      if (!validGuestIds.contains(entry.guestId())) {
        throw new BusinessError(
            "guest_not_in_group",
            "Guest " + entry.guestId() + " does not belong to group " + group.id());
      }
    }

    // Apply per-guest RSVPs through the guests module. No actor — the groupToken is the credential.
    for (PublicGroupRsvpRequestDto.Entry entry : dto.guests()) {
      guestApi.applyRsvpFromInvitation(
          entry.guestId(), new RsvpUpdateDto(entry.status(), dto.message()));
    }

    log.info(
        "invitation.rsvp_received slug={} groupId={} guestsUpdated={} message.len={}",
        slug,
        group.id(),
        dto.guests().size(),
        dto.message() == null ? 0 : dto.message().length());

    List<GuestDto> updated = guestApi.listGuestsByGroupId(group.id());
    return new PublicGroupViewDto(slug, group, updated);
  }

  // ============== Helpers ==============

  private EventInvitationConfig loadActiveConfig(String slug) {
    EventInvitationConfig config =
        configRepository
            .findBySlug(slug)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "invitation_not_found", "Invitation " + slug + " not found"));
    if (!config.isActive()) {
      throw new BusinessError("invitation_inactive", "Invitation is not currently published");
    }
    if (config.getDeadline() != null
        && LocalDate.now(ZoneOffset.UTC).isAfter(config.getDeadline())) {
      throw new BusinessError("invitation_expired", "Invitation deadline has passed");
    }
    return config;
  }

  private GuestGroupDto loadGroupForEvent(String eventId, String groupToken) {
    GuestGroupDto group =
        guestApi
            .findGroupByInvitationToken(groupToken)
            .orElseThrow(
                () ->
                    new ResourceNotFoundError(
                        "guest_group_not_found",
                        "Guest group for token " + groupToken + " not found"));
    if (!group.eventId().equals(eventId)) {
      throw new BusinessError(
          "group_event_mismatch",
          "Guest group " + group.id() + " does not belong to event " + eventId);
    }
    return group;
  }
}
