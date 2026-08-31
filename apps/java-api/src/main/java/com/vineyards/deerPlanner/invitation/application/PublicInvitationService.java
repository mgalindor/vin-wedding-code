package com.vineyards.deerPlanner.invitation.application;

import com.vineyards.deerPlanner.events.facade.EventFacade;
import com.vineyards.deerPlanner.invitation.application.port.EventInvitationConfigRepository;
import com.vineyards.deerPlanner.invitation.application.port.InvitationTemplateRepository;
import com.vineyards.deerPlanner.invitation.domain.EventInvitationConfig;
import com.vineyards.deerPlanner.invitation.facade.PublicInvitationFacade;
import com.vineyards.deerPlanner.invitation.facade.dto.InvitationTemplateDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicInvitationDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpRequestDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpResponseDto;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import java.time.LocalDate;
import java.time.ZoneOffset;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Public invitation surface. No caller identity — the {@code slug} is the token. The service is
 * consumed exclusively by {@code invitation/inbound/PublicInvitationController}.
 */
@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class PublicInvitationService implements PublicInvitationFacade {

  private final EventInvitationConfigRepository configRepository;
  private final InvitationTemplateRepository templateRepository;
  private final EventFacade eventApi;

  @Override
  @Transactional(readOnly = true)
  public PublicInvitationDto getBySlug(String slug) {
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

    return new PublicInvitationDto(
        config.getSlug(), config.isActive(), config.isRsvpEnabled(), event, template);
  }

  @Override
  @Transactional
  public PublicRsvpResponseDto submitRsvp(String slug, PublicRsvpRequestDto dto) {
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
    if (!config.isRsvpEnabled()) {
      throw new BusinessError("rsvp_disabled", "RSVP is disabled for this invitation");
    }
    if (config.getRsvpDeadline() != null
        && LocalDate.now(ZoneOffset.UTC).isAfter(config.getRsvpDeadline())) {
      throw new BusinessError("rsvp_deadline_passed", "RSVP deadline has passed");
    }

    // Per-guest persistence lands when the guests module is delivered; we record an
    // audit-style event and return the normalised response so the FE can react.
    log.info(
        "invitation.rsvp_received slug={} response={} message.len={}",
        slug,
        dto.response(),
        dto.message() == null ? 0 : dto.message().length());

    return new PublicRsvpResponseDto(
        dto.response().name(), "RSVP recorded. The guest list will be updated shortly.");
  }
}
