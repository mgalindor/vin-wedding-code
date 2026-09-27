package com.vineyards.deerPlanner.invitation.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.events.facade.WeddingEventInPort;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
import com.vineyards.deerPlanner.guests.facade.GuestInPort;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.RsvpUpdateDto;
import com.vineyards.deerPlanner.invitation.application.port.EventInvitationConfigOutPort;
import com.vineyards.deerPlanner.invitation.application.port.InvitationTemplateOutPort;
import com.vineyards.deerPlanner.invitation.domain.EventInvitationConfig;
import com.vineyards.deerPlanner.invitation.domain.InvitationTemplate;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicGroupRsvpRequestDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicGroupViewDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicInvitationDto;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PublicInvitationServiceTest {

  @Mock EventInvitationConfigOutPort configRepository;
  @Mock InvitationTemplateOutPort templateRepository;
  @Mock EventInPort eventApi;
  @Mock WeddingEventInPort weddingEventApi;
  @Mock GuestInPort guestApi;

  @InjectMocks PublicInvitationService service;

  private static final String SLUG = "emma-james-2026";
  private static final String EVENT_ID = "evt-1";
  private static final String GROUP_ID = "grp-1";
  private static final String GROUP_TOKEN = "token-grp-1";
  private static final String TEMPLATE_ID = "tpl-wedding-romantic-v1";

  private EventInvitationConfig activeConfig() {
    return EventInvitationConfig.builder()
        .eventId(EVENT_ID)
        .templateId(TEMPLATE_ID)
        .active(true)
        .publishedAt(Instant.parse("2026-08-15T10:00:00Z"))
        .deadline(null)
        .rsvpEnabled(true)
        .rsvpDeadline(null)
        .slug(SLUG)
        .updatedAt(Instant.parse("2026-08-15T10:00:00Z"))
        .build();
  }

  private EventDto sampleEventDto() {
    return new EventDto(
        EVENT_ID,
        "user-organizer-1",
        EventType.wedding,
        "Emma & James",
        LocalDate.of(2027, 4, 15),
        EventStatus.published,
        null,
        null,
        null,
        Instant.parse("2026-08-15T10:00:00Z"),
        Instant.parse("2026-08-15T10:00:00Z"));
  }

  private GuestGroupDto sampleGroupDto() {
    return new GuestGroupDto(
        GROUP_ID,
        EVENT_ID,
        "Familia Morales",
        "family",
        null,
        null,
        null,
        GROUP_TOKEN,
        0,
        Instant.parse("2026-08-15T10:00:00Z"),
        Instant.parse("2026-08-15T10:00:00Z"));
  }

  private GuestDto sampleGuest(String id) {
    return new GuestDto(
        id,
        GROUP_ID,
        "Maria Morales",
        null,
        null,
        null,
        "token-" + id,
        "pending",
        null,
        null,
        null,
        Instant.parse("2026-08-15T10:00:00Z"),
        Instant.parse("2026-08-15T10:00:00Z"));
  }

  // ============== getBySlug ==============

  @Test
  void getBySlug_whenConfigIsActiveAndFound_returnsAggregate() {
    when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(activeConfig()));
    when(eventApi.findByEventId(EVENT_ID)).thenReturn(Optional.of(sampleEventDto()));
    when(weddingEventApi.findByEventId(EVENT_ID)).thenReturn(Optional.empty());
    when(templateRepository.findById(TEMPLATE_ID))
        .thenReturn(
            Optional.of(
                InvitationTemplate.builder()
                    .id(TEMPLATE_ID)
                    .code("wedding-romantic-v1")
                    .eventType("wedding")
                    .name("Romantic Garden")
                    .description("Elegant")
                    .active(true)
                    .displayOrder(1)
                    .createdAt(Instant.parse("2026-08-15T10:00:00Z"))
                    .updatedAt(Instant.parse("2026-08-15T10:00:00Z"))
                    .build()));

    PublicInvitationDto result = service.getBySlug(SLUG);

    assertThat(result.slug()).isEqualTo(SLUG);
    assertThat(result.active()).isTrue();
    assertThat(result.rsvpEnabled()).isTrue();
    assertThat(result.event().title()).isEqualTo("Emma & James");
    assertThat(result.template().code()).isEqualTo("wedding-romantic-v1");
    assertThat(result.wedding()).isNull();
  }

  @Test
  void getBySlug_whenConfigMissing_throwsInvitationNotFound() {
    when(configRepository.findBySlug(SLUG)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.getBySlug(SLUG))
        .isInstanceOf(ResourceNotFoundError.class)
        .hasMessageContaining(SLUG);
  }

  @Test
  void getBySlug_whenInvitationIsInactive_throwsBusinessError() {
    EventInvitationConfig inactive =
        EventInvitationConfig.builder()
            .eventId(EVENT_ID)
            .templateId(TEMPLATE_ID)
            .active(false)
            .publishedAt(null)
            .deadline(null)
            .rsvpEnabled(true)
            .rsvpDeadline(null)
            .slug(SLUG)
            .updatedAt(Instant.parse("2026-08-15T10:00:00Z"))
            .build();
    when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(inactive));

    assertThatThrownBy(() -> service.getBySlug(SLUG))
        .isInstanceOf(BusinessError.class)
        .hasMessageContaining("invitation_inactive");
  }

  @Test
  void getBySlug_whenDeadlineHasPassed_throwsBusinessError() {
    LocalDate pastDeadline = LocalDate.now(ZoneOffset.UTC).minusDays(1);
    EventInvitationConfig expired =
        EventInvitationConfig.builder()
            .eventId(EVENT_ID)
            .templateId(TEMPLATE_ID)
            .active(true)
            .publishedAt(null)
            .deadline(pastDeadline)
            .rsvpEnabled(true)
            .rsvpDeadline(null)
            .slug(SLUG)
            .updatedAt(Instant.parse("2026-08-15T10:00:00Z"))
            .build();
    when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(expired));

    assertThatThrownBy(() -> service.getBySlug(SLUG))
        .isInstanceOf(BusinessError.class)
        .hasMessageContaining("invitation_expired");
  }

  @Test
  void getBySlug_whenEventMissing_throwsBusinessError() {
    when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(activeConfig()));
    when(eventApi.findByEventId(EVENT_ID)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.getBySlug(SLUG))
        .isInstanceOf(BusinessError.class)
        .hasMessageContaining("event_missing");
  }

  // ============== getGroup ==============

  @Test
  void getGroup_whenInvitationActiveAndGroupMatches_returnsGroupAndGuests() {
    when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(activeConfig()));
    when(guestApi.findGroupByInvitationToken(GROUP_TOKEN))
        .thenReturn(Optional.of(sampleGroupDto()));
    when(guestApi.listGuestsByGroupId(GROUP_ID))
        .thenReturn(List.of(sampleGuest("gst-1"), sampleGuest("gst-2")));

    PublicGroupViewDto result = service.getGroup(SLUG, GROUP_TOKEN);

    assertThat(result.slug()).isEqualTo(SLUG);
    assertThat(result.group().id()).isEqualTo(GROUP_ID);
    assertThat(result.guests()).hasSize(2);
  }

  @Test
  void getGroup_whenGroupBelongsToDifferentEvent_throwsBusinessError() {
    GuestGroupDto foreignGroup =
        new GuestGroupDto(
            GROUP_ID,
            "evt-other",
            "Otra familia",
            "family",
            null,
            null,
            null,
            GROUP_TOKEN,
            0,
            Instant.parse("2026-08-15T10:00:00Z"),
            Instant.parse("2026-08-15T10:00:00Z"));
    when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(activeConfig()));
    when(guestApi.findGroupByInvitationToken(GROUP_TOKEN)).thenReturn(Optional.of(foreignGroup));

    assertThatThrownBy(() -> service.getGroup(SLUG, GROUP_TOKEN))
        .isInstanceOf(BusinessError.class)
        .hasMessageContaining("group_event_mismatch");
  }

  // ============== submitGroupRsvp ==============

  @Test
  void submitGroupRsvp_whenValid_persistsViaGuestApiAndReturnsUpdatedView() {
    when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(activeConfig()));
    when(guestApi.findGroupByInvitationToken(GROUP_TOKEN))
        .thenReturn(Optional.of(sampleGroupDto()));
    when(guestApi.listGuestsByGroupId(GROUP_ID))
        .thenReturn(List.of(sampleGuest("gst-1"), sampleGuest("gst-2")));

    PublicGroupRsvpRequestDto dto =
        new PublicGroupRsvpRequestDto(
            "All confirmed",
            List.of(
                new PublicGroupRsvpRequestDto.Entry("gst-1", RsvpStatus.confirmed),
                new PublicGroupRsvpRequestDto.Entry("gst-2", RsvpStatus.declined)));

    PublicGroupViewDto result = service.submitGroupRsvp(SLUG, GROUP_TOKEN, dto);

    ArgumentCaptor<RsvpUpdateDto> captor = ArgumentCaptor.forClass(RsvpUpdateDto.class);
    verify(guestApi).applyRsvpFromInvitation(eq("gst-1"), captor.capture());
    verify(guestApi).applyRsvpFromInvitation(eq("gst-2"), captor.capture());
    List<RsvpUpdateDto> calls = captor.getAllValues();
    assertThat(calls).extracting(RsvpUpdateDto::message).containsOnly("All confirmed");
    assertThat(result.group().id()).isEqualTo(GROUP_ID);
  }

  @Test
  void submitGroupRsvp_whenRsvpDisabled_throwsBusinessError() {
    EventInvitationConfig noRsvp =
        EventInvitationConfig.builder()
            .eventId(EVENT_ID)
            .templateId(TEMPLATE_ID)
            .active(true)
            .publishedAt(null)
            .deadline(null)
            .rsvpEnabled(false)
            .rsvpDeadline(null)
            .slug(SLUG)
            .updatedAt(Instant.parse("2026-08-15T10:00:00Z"))
            .build();
    when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(noRsvp));

    PublicGroupRsvpRequestDto dto =
        new PublicGroupRsvpRequestDto(
            null, List.of(new PublicGroupRsvpRequestDto.Entry("gst-1", RsvpStatus.confirmed)));

    assertThatThrownBy(() -> service.submitGroupRsvp(SLUG, GROUP_TOKEN, dto))
        .isInstanceOf(BusinessError.class)
        .hasMessageContaining("rsvp_disabled");
    verify(guestApi, never()).applyRsvpFromInvitation(any(), any());
  }

  @Test
  void submitGroupRsvp_whenGuestNotInGroup_throwsBeforeAnyWrite() {
    when(configRepository.findBySlug(SLUG)).thenReturn(Optional.of(activeConfig()));
    when(guestApi.findGroupByInvitationToken(GROUP_TOKEN))
        .thenReturn(Optional.of(sampleGroupDto()));
    when(guestApi.listGuestsByGroupId(GROUP_ID))
        .thenReturn(List.of(sampleGuest("gst-1"))); // only gst-1 is in the group

    PublicGroupRsvpRequestDto dto =
        new PublicGroupRsvpRequestDto(
            null,
            List.of(
                new PublicGroupRsvpRequestDto.Entry("gst-1", RsvpStatus.confirmed),
                new PublicGroupRsvpRequestDto.Entry("gst-999", RsvpStatus.confirmed)));

    assertThatThrownBy(() -> service.submitGroupRsvp(SLUG, GROUP_TOKEN, dto))
        .isInstanceOf(BusinessError.class)
        .hasMessageContaining("guest_not_in_group");
    // Critical: no partial writes happened.
    verify(guestApi, never()).applyRsvpFromInvitation(any(), any());
  }
}
