package com.vineyards.deerPlanner.invitation.application;

import com.vineyards.deerPlanner.events.facade.EventApi;
import com.vineyards.deerPlanner.invitation.application.port.EventInvitationConfigRepository;
import com.vineyards.deerPlanner.invitation.application.port.InvitationTemplateRepository;
import com.vineyards.deerPlanner.invitation.domain.EventInvitationConfig;
import com.vineyards.deerPlanner.invitation.domain.InvitationNotFoundException;
import com.vineyards.deerPlanner.invitation.domain.InvitationTemplate;
import com.vineyards.deerPlanner.invitation.facade.PublicInvitationApi;
import com.vineyards.deerPlanner.invitation.facade.dto.EventInvitationConfigDto;
import com.vineyards.deerPlanner.invitation.facade.dto.InvitationTemplateDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicInvitationDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpRequestDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpResponseDto;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;

/**
 * Public invitation surface. No caller identity — the {@code slug} is the token. The
 * service is consumed exclusively by {@code invitation/inbound/PublicInvitationController}.
 */
@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class PublicInvitationService implements PublicInvitationApi {

    private final EventInvitationConfigRepository configRepository;
    private final InvitationTemplateRepository templateRepository;
    private final EventApi eventApi;

    @Override
    @Transactional(readOnly = true)
    public PublicInvitationDto getBySlug(String slug) {
        EventInvitationConfig config = configRepository.findBySlug(slug)
            .orElseThrow(() -> new InvitationNotFoundException(slug));

        if (!config.active()) {
            throw new BusinessError("invitation_inactive",
                "Invitation is not currently published");
        }
        if (config.deadline().isPresent() && LocalDate.now(ZoneOffset.UTC).isAfter(config.deadline().get())) {
            throw new BusinessError("invitation_expired", "Invitation deadline has passed");
        }

        var event = eventApi.findByEventId(config.eventId())
            .orElseThrow(() -> new BusinessError("event_missing",
                "Underlying event for invitation " + slug + " was deleted"));

        InvitationTemplateDto template = config.templateId() == null
            ? null
            : templateRepository.findById(config.templateId())
                .map(InvitationTemplateService::toDto)
                .orElse(null);

        return new PublicInvitationDto(
            config.slug(),
            config.active(),
            config.rsvpEnabled(),
            event,
            template
        );
    }

    @Override
    @Transactional
    public PublicRsvpResponseDto submitRsvp(String slug, PublicRsvpRequestDto dto) {
        EventInvitationConfig config = configRepository.findBySlug(slug)
            .orElseThrow(() -> new InvitationNotFoundException(slug));

        if (!config.active()) {
            throw new BusinessError("invitation_inactive", "Invitation is not currently published");
        }
        if (!config.rsvpEnabled()) {
            throw new BusinessError("rsvp_disabled", "RSVP is disabled for this invitation");
        }
        if (config.rsvpDeadline().isPresent()
            && LocalDate.now(ZoneOffset.UTC).isAfter(config.rsvpDeadline().get())) {
            throw new BusinessError("rsvp_deadline_passed", "RSVP deadline has passed");
        }

        // Per-guest persistence lands when the guests module is delivered; we record an
        // audit-style event and return the normalised response so the FE can react.
        log.info("invitation.rsvp_received slug={} response={} message.len={}",
            slug, dto.response(), dto.message() == null ? 0 : dto.message().length());

        return new PublicRsvpResponseDto(
            dto.response().name(),
            "RSVP recorded. The guest list will be updated shortly."
        );
    }
}
