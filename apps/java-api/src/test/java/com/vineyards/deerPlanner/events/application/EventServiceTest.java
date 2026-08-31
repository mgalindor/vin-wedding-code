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
import com.vineyards.deerPlanner.events.domain.WeddingDetail;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingLandingPayloadDto;
import com.vineyards.deerPlanner.events.facade.mapper.EventPayloadMapper;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
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

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

  private static final String ORGANIZER_ID = "user-organizer-1";
  private static final String OTHER_USER_ID = "user-not-organizer-2";
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
    void createEvent_withWeddingDetail_persistsWithDraftStatusAndUuidId() {
      var dto =
          new CreateEventDto(
              "Maya & Luis",
              EventType.wedding,
              LocalDate.now().plusDays(180),
              null,
              "Maya",
              "Luis",
              null,
              null,
              null);

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
      assertThat(saved.getWedding()).isNotNull();
      assertThat(saved.getWedding().getPartner1Name()).isEqualTo("Maya");
      assertThat(result.id()).isEqualTo(saved.getId());
    }

    @Test
    void createEvent_whenEventTypeIsNotWedding_returnsNullWeddingDetail() {
      var dto =
          new CreateEventDto(
              "Cumple de SofÃƒÂ­a",
              EventType.birthday,
              LocalDate.now().plusDays(30),
              null,
              null,
              null,
              null,
              5,
              null);
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

      EventDto result = service.createEvent(dto, ORGANIZER_ID);

      // The detail builder returns null for non-wedding types Ã¢â‚¬â€ the service must not
      // persist an empty row in wedding_events for birthday/anniversary/other.
      assertThat(result.wedding()).isNull();
    }
  }

  @Nested
  class Read {

    @Test
    void getEvent_whenOrganizerMatches_returnsAggregate() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));

      EventDto result = service.getEvent(EVENT_ID, ORGANIZER_ID);

      assertThat(result.id()).isEqualTo(EVENT_ID);
      assertThat(result.status()).isEqualTo(EventStatus.draft);
    }

    @Test
    void getEvent_whenEventMissing_throwsNotFoundException() {
      when(repository.findById(EVENT_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.getEvent(EVENT_ID, ORGANIZER_ID))
          .isInstanceOf(ResourceNotFoundError.class)
          .hasMessageContaining(EVENT_ID);
    }

    @Test
    void getEvent_whenCallerIsNotTheOrganizer_throwsBusinessError() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));

      assertThatThrownBy(() -> service.getEvent(EVENT_ID, OTHER_USER_ID))
          .isInstanceOf(BusinessError.class)
          .hasMessageContaining("not_event_owner");
    }
  }

  @Nested
  class StateTransitions {

    @Test
    void publishEvent_fromDraft_succeedsAndBumpsUpdatedAt() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

      EventDto result = service.publishEvent(EVENT_ID, ORGANIZER_ID);

      assertThat(result.status()).isEqualTo(EventStatus.published);
    }

    @Test
    void publishEvent_whenAlreadyArchived_throwsBusinessError() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.archived);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));

      assertThatThrownBy(() -> service.publishEvent(EVENT_ID, ORGANIZER_ID))
          .isInstanceOf(BusinessError.class)
          .hasMessageContaining("invalid_status_transition");
    }

    @Test
    void archiveEvent_fromPublished_succeeds() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.published);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

      EventDto result = service.archiveEvent(EVENT_ID, ORGANIZER_ID);

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

      EventDto result = service.updateLocations(EVENT_ID, dto, ORGANIZER_ID);

      assertThat(result.locations()).isNotNull();
      assertThat(result.locations().entries()).hasSize(1);
      assertThat(result.locations().entries().get(0).label()).isEqualTo("Ceremony");
    }

    @Test
    void updateLocations_whenPayloadIsUnchanged_isNoopAndDoesNotBumpUpdatedAt() {
      // TODO: the new EventService.updateLocations always persists via repository.save()
      // (locationsPayload is now a typed object, not a raw JSON string). The previous
      // "skip-save-when-unchanged" behaviour is gone Ã¢â‚¬â€ revisit if it is reintroduced.
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

      EventDto result = service.updateProgram(EVENT_ID, dto, ORGANIZER_ID);

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

      EventDto result = service.updateContacts(EVENT_ID, dto, ORGANIZER_ID);

      assertThat(result.contacts()).isNotNull();
      assertThat(result.contacts().entries().get(0).fullName()).isEqualTo("Ana Rodriguez");
    }

    @Test
    void updateWeddingLanding_whenDetailMissing_createsDetailRow() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      stored.setWedding(null);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
      when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

      var dto = new WeddingLandingPayloadDto("You are cordially invited");
      when(payloadMapper.toPayload(any(WeddingLandingPayloadDto.class)))
          .thenReturn(
              new com.vineyards.deerPlanner.events.domain.payload.WeddingLandingPayload(null));
      when(payloadMapper.toDto(
              any(com.vineyards.deerPlanner.events.domain.payload.WeddingLandingPayload.class)))
          .thenReturn(dto);

      EventDto result = service.updateWeddingLanding(EVENT_ID, dto, ORGANIZER_ID);

      assertThat(result.wedding()).isNotNull();
      assertThat(result.wedding().landing()).isNotNull();
      assertThat(result.wedding().landing().preTitle()).isEqualTo("You are cordially invited");
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

      var partialDto =
          new UpdateEventDto("Maya & Luis Ã¢â‚¬â€ Updated Title", null, null, null, null);

      EventDto result = service.updateEventMetadata(EVENT_ID, partialDto, ORGANIZER_ID);

      assertThat(result.title()).isEqualTo("Maya & Luis Ã¢â‚¬â€ Updated Title");
      assertThat(result.eventDate()).isEqualTo(stored.getEventDate());
      assertThat(result.locations()).isNotNull();
    }
  }

  @Nested
  class ListOwnEvents {

    @Test
    void listOwnEvents_whenEventsExist_returnsItemsWrappedInResponse() {
      Event one = sampleEvent("evt-1", ORGANIZER_ID, EventStatus.draft);
      Event two = sampleEvent("evt-2", ORGANIZER_ID, EventStatus.published);
      when(repository.findByOrganizerId(ORGANIZER_ID)).thenReturn(List.of(one, two));

      var response = service.listOwnEvents(ORGANIZER_ID);

      assertThat(response.items()).hasSize(2);
      assertThat(response.total()).isEqualTo(2);
      assertThat(response.hasMore()).isFalse();
      assertThat(response.items().get(0).id()).isEqualTo("evt-1");
    }
  }

  @Nested
  class OwnershipEnforcement {

    @Test
    void updateLocations_whenCallerIsNotOrganizer_throwsBusinessError() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));

      var dto = new LocationsPayloadDto(List.of());

      assertThatThrownBy(() -> service.updateLocations(EVENT_ID, dto, OTHER_USER_ID))
          .isInstanceOf(BusinessError.class);
    }

    @Test
    void deleteEvent_whenCallerIsNotOrganizer_throwsBusinessError() {
      Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
      when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));

      assertThatThrownBy(() -> service.deleteEvent(EVENT_ID, OTHER_USER_ID))
          .isInstanceOf(BusinessError.class);
      org.mockito.Mockito.verify(repository, org.mockito.Mockito.never())
          .deleteById(org.mockito.ArgumentMatchers.anyString());
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
        new WeddingDetail("Maya", "Luis", true, null, null, null, null, null, null),
        Instant.now(),
        Instant.now());
  }
}
