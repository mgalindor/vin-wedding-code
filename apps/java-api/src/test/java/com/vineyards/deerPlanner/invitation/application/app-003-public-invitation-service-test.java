package com.vineyards.deerPlanner.invitation.application;

import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.facade.EventApi;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.invitation.application.port.EventInvitationConfigRepository;
import com.vineyards.deerPlanner.invitation.application.port.InvitationTemplateRepository;
import com.vineyards.deerPlanner.invitation.domain.EventInvitationConfig;
import com.vineyards.deerPlanner.invitation.domain.InvitationNotFoundException;
import com.vineyards.deerPlanner.invitation.domain.InvitationTemplate;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicInvitationDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpRequestDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpResponseDto;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class App003PublicInvitationServiceTest {

    @Mock EventInvitationConfigRepository configRepository;
    @Mock InvitationTemplateRepository templateRepository;
    @Mock EventApi eventApi;

    @InjectMocks PublicInvitationService service;

    private static final String SLUG = "emma-james-2026";
    private static final String EVENT_ID = "evt-1";
    private static final String TEMPLATE_ID = "tpl-wedding-romantic-v1";

    private EventInvitationConfig activeConfig() {
        return new EventInvitationConfig(
            EVENT_ID, TEMPLATE_ID, true,
            Optional.of(OffsetDateTime.parse("2026-08-15T10:00:00Z")),
            Optional.empty(), true, Optional.empty(),
            SLUG, OffsetDateTime.parse("2026-08-15T10:00:00Z")
        );
    }

    private EventDto sampleEventDto() {
        return new EventDto(
            EVENT_ID, "user-organizer-1", EventType.wedding, "Emma & James",
            LocalDate.of(2027, 4, 15), EventStatus.published,
            null, null, null, null,
            OffsetDateTime.parse("2026-08-15T10:00:00Z"),
            OffsetDateTime.parse("2026-08-15T10:00:00Z")
        );
    }

    @Test
    void getBySlug_returnsAggregate_whenConfigIsActiveAndFound() {
        when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(activeConfig()));
        when(eventApi.findByEventId(EVENT_ID)).thenReturn(Optional.of(sampleEventDto()));
        when(templateRepository.findById(TEMPLATE_ID))
            .thenReturn(Optional.of(new InvitationTemplate(
                TEMPLATE_ID, "wedding-romantic-v1", "wedding", "Romantic Garden",
                "Elegant", true, 1,
                OffsetDateTime.parse("2026-08-15T10:00:00Z"),
                OffsetDateTime.parse("2026-08-15T10:00:00Z")
            )));

        PublicInvitationDto result = service.getBySlug(SLUG);

        assertThat(result.slug()).isEqualTo(SLUG);
        assertThat(result.active()).isTrue();
        assertThat(result.rsvpEnabled()).isTrue();
        assertThat(result.event().title()).isEqualTo("Emma & James");
        assertThat(result.template().code()).isEqualTo("wedding-romantic-v1");
    }

    @Test
    void getBySlug_throwsInvitationNotFound_whenConfigMissing() {
        when(configRepository.findBySlug(SLUG)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getBySlug(SLUG))
            .isInstanceOf(InvitationNotFoundException.class)
            .hasMessageContaining(SLUG);
    }

    @Test
    void getBySlug_throwsBusinessError_whenInvitationIsInactive() {
        EventInvitationConfig inactive = new EventInvitationConfig(
            EVENT_ID, TEMPLATE_ID, false,
            Optional.empty(), Optional.empty(), true, Optional.empty(),
            SLUG, OffsetDateTime.parse("2026-08-15T10:00:00Z")
        );
        when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(inactive));

        assertThatThrownBy(() -> service.getBySlug(SLUG))
            .isInstanceOf(BusinessError.class)
            .hasMessageContaining("invitation_inactive");
    }

    @Test
    void getBySlug_throwsBusinessError_whenDeadlineHasPassed() {
        LocalDate pastDeadline = LocalDate.now(ZoneOffset.UTC).minusDays(1);
        EventInvitationConfig expired = new EventInvitationConfig(
            EVENT_ID, TEMPLATE_ID, true,
            Optional.empty(), Optional.of(pastDeadline), true, Optional.empty(),
            SLUG, OffsetDateTime.parse("2026-08-15T10:00:00Z")
        );
        when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> service.getBySlug(SLUG))
            .isInstanceOf(BusinessError.class)
            .hasMessageContaining("invitation_expired");
    }

    @Test
    void getBySlug_throwsBusinessError_whenEventMissing() {
        when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(activeConfig()));
        when(eventApi.findByEventId(EVENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getBySlug(SLUG))
            .isInstanceOf(BusinessError.class)
            .hasMessageContaining("event_missing");
    }

    @Test
    void submitRsvp_returnsResponse_whenActiveAndRsvpEnabled() {
        when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(activeConfig()));

        PublicRsvpRequestDto dto = new PublicRsvpRequestDto(
            PublicRsvpRequestDto.Response.confirmed_full, "Looking forward to it"
        );

        PublicRsvpResponseDto result = service.submitRsvp(SLUG, dto);

        assertThat(result.status()).isEqualTo("confirmed_full");
        assertThat(result.message()).isNotBlank();
    }

    @Test
    void submitRsvp_throwsBusinessError_whenRsvpDisabled() {
        EventInvitationConfig noRsvp = new EventInvitationConfig(
            EVENT_ID, TEMPLATE_ID, true,
            Optional.empty(), Optional.empty(), false, Optional.empty(),
            SLUG, OffsetDateTime.parse("2026-08-15T10:00:00Z")
        );
        when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(noRsvp));

        PublicRsvpRequestDto dto = new PublicRsvpRequestDto(
            PublicRsvpRequestDto.Response.declined, null
        );

        assertThatThrownBy(() -> service.submitRsvp(SLUG, dto))
            .isInstanceOf(BusinessError.class)
            .hasMessageContaining("rsvp_disabled");
    }
}
