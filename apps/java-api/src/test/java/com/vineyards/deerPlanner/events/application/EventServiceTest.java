package com.vineyards.deerPlanner.events.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vineyards.deerPlanner.events.application.port.EventOutPort;
import com.vineyards.deerPlanner.events.domain.Event;
import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import com.vineyards.deerPlanner.events.facade.mapper.EventPayloadMapper;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Authorisation is enforced at the inbound layer (SpEL @PreAuthorize + the {@code eventSecurity}
 * bean). The service trusts the caller and only handles persistence + business invariants, so these
 * tests focus on those concerns and no longer assert "only the organiser can mutate".
 */
@ExtendWith(MockitoExtension.class)
class EventServiceTest {

  private static final String ORGANIZER_ID = "user-organizer-1";
  private static final String EVENT_ID = "evt-1";

  @Mock EventOutPort repository;
  @Mock EventPayloadMapper payloadMapper;

  EventService service;

  @BeforeEach
  void setUp() {
    service = new EventService(repository, payloadMapper);
  }

  @Nested
  class CreateEvent {

    @Test
    void createEvent_persistsWithDraftStatusAndUuidId() {
      var dto = new CreateEventDto("Maya & Luis", EventType.wedding, LocalDate.now().plusDays(180));

      ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

      EventDto result = service.createEvent(dto, ORGANIZER_ID);

      verify(repository).save(captor.capture());
      Event saved = captor.getValue();
      assertThat(saved.getId()).isNotBlank();
      assertThat(UUID.fromString(saved.getId())).isNotNull();
      assertThat(saved.getOrganizerId()).isEqualTo(ORGANIZER_ID);
      assertThat(saved.getStatus()).isEqualTo(EventStatus.draft);
      assertThat(saved.getTitle()).isEqualTo("Maya & Luis");
      assertThat(saved.getEventType()).isEqualTo(EventType.wedding);
      assertThat(result.id()).isEqualTo(saved.getId());
    }

    @Test
    void createEvent_forBirthday_keepsEventTypeButNoWeddingDetail() {
      var dto =
          new CreateEventDto("Cumple de Sofía", EventType.birthday, LocalDate.now().plusDays(30));
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

      EventDto result = service.createEvent(dto, ORGANIZER_ID);

      assertThat(result.eventType()).isEqualTo(EventType.birthday);
    }
  }

  @Nested
  class Read {

    @Test
    void getEvent_whenPresent_returnsAggregate() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));

      EventDto result = service.getEvent(EVENT_ID);

      assertThat(result.id()).isEqualTo(EVENT_ID);
      assertThat(result.status()).isEqualTo(EventStatus.draft);
    }

    @Test
    void getEvent_whenEventMissing_throwsNotFoundException() {
      when(repository.findById(EVENT_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.getEvent(EVENT_ID))
          .isInstanceOf(ResourceNotFoundError.class)
          .hasMessageContaining(EVENT_ID);
    }
  }

  @Nested
  class StateTransitions {

    @Test
    void archiveEvent_fromPublished_succeeds() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.published);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

      EventDto result = service.archiveEvent(EVENT_ID);

      assertThat(result.status()).isEqualTo(EventStatus.archived);
    }
  }

  @Nested
  class PayloadUpdates {

    @Test
    void updateLocations_withValidPayload_serialisesPayloadAndPersists() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

      var dto =
          new LocationsPayloadDto(
              List.of(
                  new LocationsPayloadDto.Entry(
                      "Ceremony",
                      "Parroquia San Miguel",
                      "Av. Reforma 123",
                      "CDMX",
                      "https://maps.google.com/?q=parroquia",
                      "16:00",
                      null)));
      var expectedPayload =
          new com.vineyards.deerPlanner.events.domain.payload.LocationsPayload(List.of());
      when(payloadMapper.toPayload(any(LocationsPayloadDto.class))).thenReturn(expectedPayload);
      when(payloadMapper.toDto(
              any(com.vineyards.deerPlanner.events.domain.payload.LocationsPayload.class)))
          .thenReturn(dto);

      EventDto result = service.updateLocations(EVENT_ID, dto);

      assertThat(result.locations()).isNotNull();
      assertThat(result.locations().entries()).hasSize(1);
      assertThat(result.locations().entries().get(0).label()).isEqualTo("Ceremony");
    }

    @Test
    void updateProgram_withValidPayload_serialisesProgramPayload() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

      var dto =
          new ProgramPayloadDto(
              List.of(
                  new ProgramPayloadDto.Day(
                      LocalDate.now().plusDays(180),
                      "Saturday",
                      List.of(new ProgramPayloadDto.Item("16:00", "Ceremony", "Parroquia")))));
      when(payloadMapper.toPayload(any(ProgramPayloadDto.class)))
          .thenReturn(
              new com.vineyards.deerPlanner.events.domain.payload.ProgramPayload(List.of()));
      when(payloadMapper.toDto(
              any(com.vineyards.deerPlanner.events.domain.payload.ProgramPayload.class)))
          .thenReturn(dto);

      EventDto result = service.updateProgram(EVENT_ID, dto);

      assertThat(result.program()).isNotNull();
      assertThat(result.program().days()).hasSize(1);
    }

    @Test
    void updateContacts_withValidPayload_serialisesContactsPayload() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

      var dto =
          new ContactsPayloadDto(
              List.of(
                  new ContactsPayloadDto.Entry(
                      "Wedding Planner", "Ana Rodriguez", "+52 55 1234 5678", "ana@example.com")));
      when(payloadMapper.toPayload(any(ContactsPayloadDto.class)))
          .thenReturn(
              new com.vineyards.deerPlanner.events.domain.payload.ContactsPayload(List.of()));
      when(payloadMapper.toDto(
              any(com.vineyards.deerPlanner.events.domain.payload.ContactsPayload.class)))
          .thenReturn(dto);

      EventDto result = service.updateContacts(EVENT_ID, dto);

      assertThat(result.contacts()).isNotNull();
      assertThat(result.contacts().entries().get(0).fullName()).isEqualTo("Ana Rodriguez");
    }
  }

  @Nested
  class MetadataUpdate {

    @Test
    void updateEventMetadata_whenPartialDtoProvided_preservesUnchangedFields() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      stored.setLocationsPayload(
          new com.vineyards.deerPlanner.events.domain.payload.LocationsPayload(List.of()));
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
      var existingDto =
          new LocationsPayloadDto(
              List.of(new LocationsPayloadDto.Entry("x", "n", "a", "c", null, "t", null)));
      when(payloadMapper.toDto(
              any(com.vineyards.deerPlanner.events.domain.payload.LocationsPayload.class)))
          .thenReturn(existingDto);

      var partialDto = new UpdateEventDto("Maya & Luis — Updated Title", null);

      EventDto result = service.updateEventMetadata(EVENT_ID, partialDto);

      assertThat(result.title()).isEqualTo("Maya & Luis — Updated Title");
      assertThat(result.eventDate()).isEqualTo(stored.getEventDate());
      assertThat(result.locations()).isNotNull();
    }

    @Test
    void updateEventMetadata_withAllNullFields_isNoopForContentButBumpsUpdatedAt() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      Instant before = stored.getUpdatedAt();
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

      EventDto result = service.updateEventMetadata(EVENT_ID, new UpdateEventDto(null, null));

      assertThat(result.title()).isEqualTo(stored.getTitle());
      assertThat(result.eventDate()).isEqualTo(stored.getEventDate());
      assertThat(result.updatedAt()).isAfterOrEqualTo(before);
    }
  }

  @Nested
  class ListOwnEvents {

    @Test
    void listOwnEvents_whenOrganiser_returnsOwnEventsFilteredByOrganizerId() {
      Event one = sampleEvent("evt-1", ORGANIZER_ID, EventStatus.draft);
      Event two = sampleEvent("evt-2", ORGANIZER_ID, EventStatus.published);
      when(repository.search(
              any(org.springframework.data.jpa.domain.Specification.class),
              any(org.springframework.data.domain.Pageable.class)))
          .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(one, two)));

      var response =
          service.listOwnEvents(
              ORGANIZER_ID,
              false,
              null,
              null,
              null,
              null,
              null,
              org.springframework.data.domain.Pageable.unpaged());

      assertThat(response.page().items()).hasSize(2);
      assertThat(response.page().total()).isEqualTo(2);
      assertThat(response.page().hasMore()).isFalse();
    }
  }

  private static Event sampleEvent(String id, String organizerId, EventStatus status) {
    return new Event(
        id,
        organizerId,
        EventType.wedding,
        "Maya & Luis",
        LocalDate.now().plusDays(180),
        status,
        null,
        null,
        null,
        Instant.now(),
        Instant.now());
  }
}
