package com.vineyards.deerPlanner.guests.application;

import com.vineyards.deerPlanner.events.facade.EventApi;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.domain.EventNotFoundException;
import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.guests.application.port.GuestGroupRepository;
import com.vineyards.deerPlanner.guests.application.port.GuestRepository;
import com.vineyards.deerPlanner.guests.domain.Guest;
import com.vineyards.deerPlanner.guests.domain.GuestGroup;
import com.vineyards.deerPlanner.guests.domain.GuestGroupNotFoundException;
import com.vineyards.deerPlanner.guests.domain.GuestNotFoundException;
import com.vineyards.deerPlanner.guests.domain.GuestRelationship;
import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupDto;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class App004GuestServiceTest {

    private static final String ORGANIZER_ID = "user-organizer-1";
    private static final String EVENT_ID = "evt-1";
    private static final String GROUP_ID = "grp-1";
    private static final String GUEST_ID = "gst-1";

    @Mock GuestGroupRepository groupRepository;
    @Mock GuestRepository guestRepository;
    @Mock EventApi eventApi;

    @InjectMocks GuestService service;

    private static GuestGroup sampleGroup(String id) {
        return new GuestGroup(
            id, EVENT_ID, "Familia Morales",
            Optional.of("Novia"),
            GuestRelationship.family,
            Optional.of("familia@example.com"),
            Optional.of("+521234567890"),
            Optional.empty(),
            "token-" + id,
            0,
            OffsetDateTime.parse("2026-08-01T10:00:00Z"),
            OffsetDateTime.parse("2026-08-01T10:00:00Z")
        );
    }

    private static Guest sampleGuest(String id, String groupId) {
        return new Guest(
            id, groupId, "Maria", "Morales",
            Optional.of("maria@example.com"),
            Optional.of("+521111111111"),
            Optional.empty(),
            true, "token-" + id,
            RsvpStatus.pending, Optional.empty(), Optional.empty(), Optional.empty(),
            OffsetDateTime.parse("2026-08-01T10:00:00Z"),
            OffsetDateTime.parse("2026-08-01T10:00:00Z")
        );
    }

    @BeforeEach
    void allowOwnershipCheck() {
        // The eventApi is mocked to return Optional.empty() by default; tests that need a
        // successful ownership check call verifyOwnershipPasses() below.
    }

    private void verifyOwnershipPasses() {
        when(eventApi.getEvent(eq(EVENT_ID), eq(ORGANIZER_ID)))
            .thenReturn(new EventDto(
                EVENT_ID, ORGANIZER_ID, EventType.wedding, "Maya & Luis",
                java.time.LocalDate.of(2027, 4, 15), EventStatus.draft,
                null, null, null, null,
                OffsetDateTime.parse("2026-08-15T10:00:00Z"),
                OffsetDateTime.parse("2026-08-15T10:00:00Z")
            ));
    }

    @Nested
    class ListGroups {

        @Test
        void listGroups_returnsRootedResponse() {
            verifyOwnershipPasses();
            when(groupRepository.findByEventId(EVENT_ID))
                .thenReturn(List.of(sampleGroup("grp-1"), sampleGroup("grp-2")));

            var response = service.listGroups(EVENT_ID, ORGANIZER_ID);

            assertThat(response.items()).hasSize(2);
            assertThat(response.total()).isEqualTo(2);
        }

        @Test
        void listGroups_throwsWhenCallerIsNotOwner() {
            when(eventApi.getEvent(eq(EVENT_ID), eq("intruder")))
                .thenThrow(new BusinessError("not_event_owner", "Not the event organiser"));

            assertThatThrownBy(() -> service.listGroups(EVENT_ID, "intruder"))
                .isInstanceOf(BusinessError.class);
        }
    }

    @Nested
    class CreateGroup {

        @Test
        void createGroup_assignsUuidAndPersists() {
            verifyOwnershipPasses();
            when(groupRepository.save(any(GuestGroup.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            var dto = new CreateGuestGroupDto(
                "Familia Morales", "Novia", "family", "fm@example.com", "+52123", 0
            );

            GuestGroupDto result = service.createGroup(EVENT_ID, dto, ORGANIZER_ID);

            assertThat(result.id()).isNotBlank();
            assertThat(result.eventId()).isEqualTo(EVENT_ID);
            assertThat(result.name()).isEqualTo("Familia Morales");
            assertThat(result.relationship()).isEqualTo("family");
            assertThat(result.invitationToken()).isNotBlank();
            verify(groupRepository).save(any(GuestGroup.class));
        }
    }

    @Nested
    class TokenRotation {

        @Test
        void regenerateGroupToken_issuesNewUuid() {
            verifyOwnershipPasses();
            GuestGroup current = sampleGroup(GROUP_ID);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(current));
            when(groupRepository.save(any(GuestGroup.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            GuestGroupDto result = service.regenerateGroupToken(GROUP_ID, ORGANIZER_ID);

            assertThat(result.invitationToken()).isNotEqualTo(current.invitationToken());
        }
    }

    @Nested
    class CreateGuest {

        @Test
        void createGuest_validatesGroupExists() {
            verifyOwnershipPasses();
            when(groupRepository.findById("grp-missing"))
                .thenReturn(Optional.empty());

            var dto = new CreateGuestDto(
                "grp-missing", "Maria", "Morales", null, null, null, null
            );

            assertThatThrownBy(() -> service.createGuest(EVENT_ID, dto, ORGANIZER_ID))
                .isInstanceOf(GuestGroupNotFoundException.class);
        }

        @Test
        void createGuest_persistsAndDefaultsRsvpToPending() {
            verifyOwnershipPasses();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(sampleGroup(GROUP_ID)));
            when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));

            var dto = new CreateGuestDto(
                GROUP_ID, "Maria", "Morales", null, null, null, true
            );

            GuestDto result = service.createGuest(EVENT_ID, dto, ORGANIZER_ID);

            assertThat(result.rsvpStatus()).isEqualTo("pending");
            assertThat(result.primary()).isTrue();
        }
    }

    @Nested
    class ReadGuest {

        @Test
        void getGuest_throwsWhenMissing() {
            when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getGuest(GUEST_ID, ORGANIZER_ID))
                .isInstanceOf(GuestNotFoundException.class);
        }

        @Test
        void getGuest_returnsGuest_whenOwnershipValid() {
            verifyOwnershipPasses();
            when(guestRepository.findById(GUEST_ID))
                .thenReturn(Optional.of(sampleGuest(GUEST_ID, GROUP_ID)));
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(sampleGroup(GROUP_ID)));

            GuestDto result = service.getGuest(GUEST_ID, ORGANIZER_ID);

            assertThat(result.firstName()).isEqualTo("Maria");
        }
    }

    @Nested
    class OwnershipBoundary {

        @Test
        void listGuests_throwsEventNotFound_whenEventDoesNotExist() {
            when(eventApi.getEvent(eq(EVENT_ID), any(String.class)))
                .thenThrow(new EventNotFoundException(EVENT_ID));

            assertThatThrownBy(() -> service.listGuests(EVENT_ID, ORGANIZER_ID))
                .isInstanceOf(EventNotFoundException.class);
        }

        @Test
        void deleteGroup_doesNotInvokeRepository_whenCallerIsNotOwner() {
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(sampleGroup(GROUP_ID)));
            when(eventApi.getEvent(eq(EVENT_ID), eq("intruder")))
                .thenThrow(new BusinessError("not_event_owner", "Not the event organiser"));

            assertThatThrownBy(() -> service.deleteGroup(GROUP_ID, "intruder"))
                .isInstanceOf(BusinessError.class);
            verify(groupRepository, never()).deleteById(any(String.class));
        }
    }
}
