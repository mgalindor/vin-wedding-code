package com.vineyards.deerPlanner.invitation.application;

import com.vineyards.deerPlanner.events.facade.EventFacade;
import com.vineyards.deerPlanner.invitation.application.port.EventInvitationConfigRepository;
import com.vineyards.deerPlanner.invitation.domain.EventInvitationConfig;
import com.vineyards.deerPlanner.invitation.facade.EventInvitationConfigFacade;
import com.vineyards.deerPlanner.invitation.facade.dto.EventInvitationConfigDto;
import com.vineyards.deerPlanner.invitation.facade.dto.UpdateInvitationConfigDto;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class EventInvitationConfigService implements EventInvitationConfigFacade {

    private final EventInvitationConfigRepository repository;
    private final EventFacade eventApi;

    @Override
    @Transactional(readOnly = true)
    public EventInvitationConfigDto getInvitationConfig(String eventId, String actorUserId) {
        // Ownership proof: the calling user must be able to read the event.
        eventApi.getEvent(eventId, actorUserId);
        EventInvitationConfig config = repository.findByEventId(eventId)
            .orElseGet(() -> createDefaultConfig(eventId));
        return toDto(config);
    }

    @Override
    @Transactional
    public EventInvitationConfigDto updateInvitationConfig(String eventId, UpdateInvitationConfigDto dto, String actorUserId) {
        eventApi.getEvent(eventId, actorUserId);
        EventInvitationConfig current = repository.findByEventId(eventId)
            .orElseGet(() -> createDefaultConfig(eventId));

        if (dto.slug() != null && !dto.slug().equals(current.slug())
            && repository.existsBySlug(dto.slug())) {
            throw new BusinessError("slug_taken", "Slug '" + dto.slug() + "' is already in use");
        }

        EventInvitationConfig updated = applyPatch(current, dto);
        boolean activationRequested = dto.active() != null && dto.active() && !current.active();
        if (activationRequested && updated.templateId() == null) {
            throw new BusinessError("missing_template",
                "An invitation cannot be activated without a selected template");
        }
        if (activationRequested) {
            updated = updated.withPublishedAt(OffsetDateTime.now());
            log.info("invitation.activated eventId={} actorUserId={}", eventId, actorUserId);
        }

        return toDto(repository.save(updated));
    }

    private EventInvitationConfig applyPatch(EventInvitationConfig current, UpdateInvitationConfigDto dto) {
        EventInvitationConfig next = current;
        if (dto.templateId() != null) {
            next = next.withTemplate(dto.templateId());
        }
        if (dto.active() != null) {
            next = next.withActivation(dto.active());
        }
        if (dto.rsvpEnabled() != null) {
            next = next.withRsvpEnabled(dto.rsvpEnabled());
        }
        if (dto.deadline() != null || dto.rsvpDeadline() != null) {
            LocalDate deadline = dto.deadline() != null ? dto.deadline() : current.deadline().orElse(null);
            LocalDate rsvpDeadline = dto.rsvpDeadline() != null ? dto.rsvpDeadline() : current.rsvpDeadline().orElse(null);
            next = next.withDeadlines(deadline, rsvpDeadline);
        }
        if (dto.slug() != null) {
            next = next.withSlug(dto.slug());
        }
        return next;
    }

    /**
     * Lazy-create: when an Organizer asks for the invitation config of an event for the first
     * time, we instantiate it with sensible defaults. The first explicit PUT fills in the rest.
     */
    private EventInvitationConfig createDefaultConfig(String eventId) {
        EventInvitationConfig defaults = new EventInvitationConfig(
            eventId, null, false,
            Optional.empty(), Optional.empty(), true, Optional.empty(),
            "event-" + eventId.substring(0, Math.min(8, eventId.length())),
            OffsetDateTime.now()
        );
        return repository.save(defaults);
    }

    static EventInvitationConfigDto toDto(EventInvitationConfig c) {
        return new EventInvitationConfigDto(
            c.eventId(),
            c.templateId(),
            c.active(),
            c.publishedAt().orElse(null),
            c.deadline().orElse(null),
            c.rsvpEnabled(),
            c.rsvpDeadline().orElse(null),
            c.slug(),
            c.updatedAt()
        );
    }
}
