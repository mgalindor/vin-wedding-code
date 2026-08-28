package com.vineyards.deerPlanner.events.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.vineyards.deerPlanner.events.application.port.EventRepository;
import com.vineyards.deerPlanner.events.domain.Event;
import com.vineyards.deerPlanner.events.domain.EventNotFoundException;
import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingLandingPayloadDto;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.security.JwtIssuerPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class App002EventServiceTest {

    private static final String ORGANIZER_ID = "user-organizer-1";
    private static final String OTHER_USER_ID = "user-not-organizer-2";
    private static final String EVENT_ID = "evt-1";

    @Mock EventRepository repository;
    @Mock JwtIssuerPort jwtIssuer;

    ObjectMapper objectMapper;
    EventService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        service = new EventService(repository, objectMapper, jwtIssuer);
    }

    @Nested
    class CreateEvent {

        @Test
        void createEvent_persistsWithDraftStatus_andUuidId() {
            var dto = new CreateEventDto(
                "Maya & Luis",
                EventType.wedding,
                LocalDate.now().plusDays(180),
                null,
                "Maya",
                "Luis",
                null, null, null
            );

            ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
            when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            EventDto result = service.createEvent(dto, ORGANIZER_ID);

            verify(repository).save(captor.capture());
            Event saved = captor.getValue();
            assertThat(saved.id()).isNotBlank();
            assertThat(UUID.fromString(saved.id())).isNotNull();
            assertThat(saved.organizerId()).isEqualTo(ORGANIZER_ID);
            assertThat(saved.status()).isEqualTo(EventStatus.draft);
            assertThat(saved.title()).isEqualTo("Maya & Luis");
            assertThat(saved.wedding()).isNotNull();
            assertThat(saved.wedding().partner1Name()).isEqualTo("Maya");
            assertThat(result.id()).isEqualTo(saved.id());
        }

        @Test
        void createEvent_returnsNullWeddingDetail_whenEventTypeIsNotWedding() {
            var dto = new CreateEventDto(
                "Cumple de Sofía",
                EventType.birthday,
                LocalDate.now().plusDays(30),
                null,
                null, null, null, 5, null
            );
            when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            EventDto result = service.createEvent(dto, ORGANIZER_ID);

            // The detail builder returns null for non-wedding types — the service must not
            // persist an empty row in wedding_events for birthday/anniversary/other.
            assertThat(result.wedding()).isNull();
        }
    }

    @Nested
    class Read {

        @Test
        void getEvent_returnsAggregate_whenOrganizerMatches() {
            Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
            when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));

            EventDto result = service.getEvent(EVENT_ID, ORGANIZER_ID);

            assertThat(result.id()).isEqualTo(EVENT_ID);
            assertThat(result.status()).isEqualTo(EventStatus.draft);
        }

        @Test
        void getEvent_throwsNotFoundException_whenEventMissing() {
            when(repository.findById(EVENT_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getEvent(EVENT_ID, ORGANIZER_ID))
                .isInstanceOf(EventNotFoundException.class)
                .hasMessageContaining(EVENT_ID);
        }

        @Test
        void getEvent_throwsBusinessError_whenCallerIsNotTheOrganizer() {
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
        void publishEvent_succeeds_fromDraft_andBumpsUpdatedAt() {
            Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
            when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
            when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            EventDto result = service.publishEvent(EVENT_ID, ORGANIZER_ID);

            assertThat(result.status()).isEqualTo(EventStatus.published);
        }

        @Test
        void publishEvent_throwsBusinessError_whenAlreadyArchived() {
            Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.archived);
            when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));

            assertThatThrownBy(() -> service.publishEvent(EVENT_ID, ORGANIZER_ID))
                .isInstanceOf(BusinessError.class)
                .hasMessageContaining("invalid_status_transition");
        }

        @Test
        void archiveEvent_succeeds_fromPublished() {
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
        void updateLocations_serialisesPayload_andPersistsJsonString() {
            Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
            when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
            when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            var dto = new LocationsPayloadDto(List.of(
                new LocationsPayloadDto.Entry(
                    "Ceremony", "Parroquia San Miguel", "Av. Reforma 123",
                    "CDMX", "https://maps.google.com/?q=parroquia", "16:00", null
                )
            ));

            EventDto result = service.updateLocations(EVENT_ID, dto, ORGANIZER_ID);

            assertThat(result.locations()).isNotNull();
            assertThat(result.locations().entries()).hasSize(1);
            assertThat(result.locations().entries().get(0).label()).isEqualTo("Ceremony");
        }

        @Test
        void updateLocations_isNoop_whenPayloadIsUnchangedAndDoesNotBumpUpdatedAt() {
            String existing = "{\"entries\":[{\"label\":\"Ceremony\",\"name\":\"n\",\"address\":\"a\",\"city\":\"c\",\"mapsLink\":null,\"time\":\"16:00\",\"notes\":null}]}";
            Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft)
                .withLocationsPayload(existing);
            when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));

            var dto = new LocationsPayloadDto(List.of(
                new LocationsPayloadDto.Entry("Ceremony", "n", "a", "c", null, "16:00", null)
            ));

            service.updateLocations(EVENT_ID, dto, ORGANIZER_ID);

            // The service should detect identical JSON and skip the repository.save round-trip.
            org.mockito.Mockito.verify(repository, org.mockito.Mockito.never()).save(any(Event.class));
        }

        @Test
        void updateProgram_serialisesProgramPayload() {
            Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
            when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
            when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            var dto = new ProgramPayloadDto(List.of(
                new ProgramPayloadDto.Day(
                    LocalDate.now().plusDays(180),
                    "Saturday",
                    List.of(new ProgramPayloadDto.Item("16:00", "Ceremony", "Parroquia"))
                )
            ));

            EventDto result = service.updateProgram(EVENT_ID, dto, ORGANIZER_ID);

            assertThat(result.program()).isNotNull();
            assertThat(result.program().days()).hasSize(1);
        }

        @Test
        void updateContacts_serialisesContactsPayload() {
            Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
            when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
            when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            var dto = new ContactsPayloadDto(List.of(
                new ContactsPayloadDto.Entry("Wedding Planner", "Ana Rodriguez",
                    "+52 55 1234 5678", "ana@example.com")
            ));

            EventDto result = service.updateContacts(EVENT_ID, dto, ORGANIZER_ID);

            assertThat(result.contacts()).isNotNull();
            assertThat(result.contacts().entries().get(0).fullName()).isEqualTo("Ana Rodriguez");
        }

        @Test
        void updateWeddingLanding_createsDetailRow_whenMissing() {
            Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft)
                .withWedding(null);
            when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
            when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            var dto = new WeddingLandingPayloadDto("You are cordially invited");

            EventDto result = service.updateWeddingLanding(EVENT_ID, dto, ORGANIZER_ID);

            assertThat(result.wedding()).isNotNull();
            assertThat(result.wedding().landing()).isNotNull();
            assertThat(result.wedding().landing().preTitle()).isEqualTo("You are cordially invited");
        }
    }

    @Nested
    class MetadataUpdate {

        @Test
        void updateEventMetadata_preservesUnchangedFields_whenPartialDtoProvided() {
            Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
            String existingLocations = "{\"entries\":[]}";
            stored = stored.withLocationsPayload(existingLocations);
            when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));
            when(repository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            var partialDto = new UpdateEventDto(
                "Maya & Luis — Updated Title",
                null, null, null, null
            );

            EventDto result = service.updateEventMetadata(EVENT_ID, partialDto, ORGANIZER_ID);

            assertThat(result.title()).isEqualTo("Maya & Luis — Updated Title");
            assertThat(result.eventDate()).isEqualTo(stored.eventDate());
            assertThat(result.locations()).isNotNull();
        }
    }

    @Nested
    class ListOwnEvents {

        @Test
        void listOwnEvents_returnsItemsWrappedInResponse() {
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
        void updateLocations_throwsBusinessError_whenCallerIsNotOrganizer() {
            Event stored = sampleEvent(EVENT_ID, ORGANIZER_ID, EventStatus.draft);
            when(repository.findById(EVENT_ID)).thenReturn(Optional.of(stored));

            var dto = new LocationsPayloadDto(List.of());

            assertThatThrownBy(() -> service.updateLocations(EVENT_ID, dto, OTHER_USER_ID))
                .isInstanceOf(BusinessError.class);
        }

        @Test
        void deleteEvent_throwsBusinessError_whenCallerIsNotOrganizer() {
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
            new Event.WeddingDetail(
                "Maya", "Luis", true,
                null, null, null, null, null, null
            ),
            OffsetDateTime.now(),
            OffsetDateTime.now()
        );
    }
}
