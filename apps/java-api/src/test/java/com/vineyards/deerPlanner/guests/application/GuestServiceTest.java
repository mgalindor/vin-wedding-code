package com.vineyards.deerPlanner.guests.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.guests.application.port.GuestGroupOutPort;
import com.vineyards.deerPlanner.guests.application.port.GuestOutPort;
import com.vineyards.deerPlanner.guests.domain.Guest;
import com.vineyards.deerPlanner.guests.domain.GuestGroup;
import com.vineyards.deerPlanner.guests.domain.GuestRelationship;
import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
import com.vineyards.deerPlanner.guests.facade.dto.ChangeGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.InlineGuestDto;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GuestServiceTest {

  private static final String ORGANIZER_ID = "user-organizer-1";
  private static final String EVENT_ID = "evt-1";
  private static final String GROUP_ID = "grp-1";
  private static final String GUEST_ID = "gst-1";

  @Mock GuestGroupOutPort groupRepository;
  @Mock GuestOutPort guestRepository;
  @Mock EventInPort eventApi;

  @InjectMocks GuestService service;

  private static GuestGroup sampleGroup(String id) {
    return new GuestGroup(
        id,
        EVENT_ID,
        "Familia Morales",
        GuestRelationship.family,
        "familia@example.com",
        "+521234567890",
        null,
        "token-" + id,
        0,
        Instant.parse("2026-08-01T10:00:00Z"),
        Instant.parse("2026-08-01T10:00:00Z"));
  }

  private static Guest sampleGuest(String id, String groupId) {
    return Guest.builder()
        .id(id)
        .groupId(groupId)
        .firstName("Maria")
        .lastName("Morales")
        .email("maria@example.com")
        .phone("+521111111111")
        .dietaryNotes(null)
        .primary(true)
        .invitationToken("token-" + id)
        .rsvpStatus(RsvpStatus.pending)
        .rsvpConfirmedAt(null)
        .rsvpMessage(null)
        .rsvpDietaryChoice(null)
        .createdAt(Instant.parse("2026-08-01T10:00:00Z"))
        .updatedAt(Instant.parse("2026-08-01T10:00:00Z"))
        .build();
  }

  @BeforeEach
  void allowOwnershipCheck() {
    // The eventApi is mocked to return Optional.empty() by default; tests that need a
    // successful ownership check call verifyOwnershipPasses() below.
  }

  private void verifyOwnershipPasses() {
    when(eventApi.getEvent(eq(EVENT_ID), eq(ORGANIZER_ID)))
        .thenReturn(
            new EventDto(
                EVENT_ID,
                ORGANIZER_ID,
                EventType.wedding,
                "Maya & Luis",
                java.time.LocalDate.of(2027, 4, 15),
                EventStatus.draft,
                null,
                null,
                null,
                null,
                Instant.parse("2026-08-15T10:00:00Z"),
                Instant.parse("2026-08-15T10:00:00Z")));
  }

  @Nested
  class ListGroups {

    @Test
    void listGroups_whenGroupsExist_returnsRootedResponse() {
      verifyOwnershipPasses();
      when(groupRepository.findByEventId(EVENT_ID))
          .thenReturn(List.of(sampleGroup("grp-1"), sampleGroup("grp-2")));

      var response = service.listGroups(EVENT_ID, ORGANIZER_ID);

      assertThat(response.items()).hasSize(2);
      assertThat(response.total()).isEqualTo(2);
    }

    @Test
    void listGroups_whenCallerIsNotOwner_throwsBusinessError() {
      when(eventApi.getEvent(eq(EVENT_ID), eq("intruder")))
          .thenThrow(new BusinessError("not_event_owner", "Not the event organiser"));

      assertThatThrownBy(() -> service.listGroups(EVENT_ID, "intruder"))
          .isInstanceOf(BusinessError.class);
    }
  }

  @Nested
  class CreateGroup {

    @Test
    void createGroup_withValidDto_assignsUuidAndPersists() {
      verifyOwnershipPasses();
      when(groupRepository.save(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));

      var dto =
          new CreateGuestGroupDto("Familia Morales", "family", "fm@example.com", "+52123", 0, null);

      GuestGroupDto result = service.createGroup(EVENT_ID, dto, ORGANIZER_ID);

      assertThat(result.id()).isNotBlank();
      assertThat(result.eventId()).isEqualTo(EVENT_ID);
      assertThat(result.name()).isEqualTo("Familia Morales");
      assertThat(result.relationship()).isEqualTo("family");
      assertThat(result.invitationToken()).isNotBlank();
      assertThat(result.primaryGuestId()).isNull();
      verify(groupRepository).save(any(GuestGroup.class));
      verify(guestRepository, never()).save(any(Guest.class));
    }

    @Test
    void createGroup_withInlineGuests_persistsGuestsAndSetsPrimaryGuestId() {
      verifyOwnershipPasses();
      when(groupRepository.save(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));

      var maria = new InlineGuestDto("Maria", "Morales", "maria@example.com", "+52111", null, true);
      var jose = new InlineGuestDto("Jose", "Morales", "jose@example.com", "+52122", null, null);
      var luis = new InlineGuestDto("Luis", "Morales", null, null, null, null);
      var dto =
          new CreateGuestGroupDto(
              "Familia Morales", "family", null, null, 0, List.of(maria, jose, luis));

      GuestGroupDto result = service.createGroup(EVENT_ID, dto, ORGANIZER_ID);

      ArgumentCaptor<Guest> captor = ArgumentCaptor.forClass(Guest.class);
      verify(guestRepository, times(3)).save(captor.capture());
      List<Guest> savedGuests = captor.getAllValues();
      assertThat(savedGuests).extracting(Guest::isPrimary).containsExactly(true, false, false);
      assertThat(savedGuests).extracting(Guest::getGroupId).containsOnly(result.id());
      // Maria is the only one marked primary -> she becomes primaryGuestId of the group.
      assertThat(result.primaryGuestId()).isEqualTo(savedGuests.get(0).getId());
    }

    @Test
    void createGroup_withInlineGuestsButNoPrimary_picksFirstAsPrimary() {
      verifyOwnershipPasses();
      when(groupRepository.save(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));

      var first = new InlineGuestDto("Maria", "Morales", null, null, null, null);
      var second = new InlineGuestDto("Jose", "Morales", null, null, null, null);
      var dto =
          new CreateGuestGroupDto(
              "Familia Morales", "family", null, null, 0, List.of(first, second));

      GuestGroupDto result = service.createGroup(EVENT_ID, dto, ORGANIZER_ID);

      ArgumentCaptor<Guest> captor = ArgumentCaptor.forClass(Guest.class);
      verify(guestRepository, times(2)).save(captor.capture());
      // No primary marked -> first guest becomes primaryGuestId.
      assertThat(result.primaryGuestId()).isEqualTo(captor.getAllValues().get(0).getId());
    }
  }

  @Nested
  class TokenRotation {

    @Test
    void regenerateGroupToken_whenGroupExists_issuesNewUuid() {
      verifyOwnershipPasses();
      GuestGroup current = sampleGroup(GROUP_ID);
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(current));
      when(groupRepository.save(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));

      GuestGroupDto result = service.regenerateGroupToken(GROUP_ID, ORGANIZER_ID);

      assertThat(result.invitationToken()).isNotEqualTo(current.getInvitationToken());
    }
  }

  @Nested
  class CreateGuest {

    @Test
    void createGuest_whenGroupDoesNotExist_throwsResourceNotFound() {
      verifyOwnershipPasses();
      when(groupRepository.findById("grp-missing")).thenReturn(Optional.empty());

      var dto = new CreateGuestDto("grp-missing", "Maria", "Morales", null, null, null, null);

      assertThatThrownBy(() -> service.createGuest(EVENT_ID, dto, ORGANIZER_ID))
          .isInstanceOf(ResourceNotFoundError.class);
    }

    @Test
    void createGuest_withValidDto_persistsAndDefaultsRsvpToPending() {
      verifyOwnershipPasses();
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(sampleGroup(GROUP_ID)));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));

      var dto = new CreateGuestDto(GROUP_ID, "Maria", "Morales", null, null, null, true);

      GuestDto result = service.createGuest(EVENT_ID, dto, ORGANIZER_ID);

      assertThat(result.rsvpStatus()).isEqualTo("pending");
      assertThat(result.primary()).isTrue();
    }
  }

  @Nested
  class ReadGuest {

    @Test
    void getGuest_whenMissing_throwsResourceNotFound() {
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.getGuest(GUEST_ID, ORGANIZER_ID))
          .isInstanceOf(ResourceNotFoundError.class);
    }

    @Test
    void getGuest_whenOwnershipValid_returnsGuest() {
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
    void listGuests_whenEventDoesNotExist_throwsResourceNotFound() {
      when(eventApi.getEvent(eq(EVENT_ID), any(String.class)))
          .thenThrow(
              new ResourceNotFoundError("event_not_found", "Event " + EVENT_ID + " not found"));

      assertThatThrownBy(() -> service.listGuests(EVENT_ID, ORGANIZER_ID))
          .isInstanceOf(ResourceNotFoundError.class);
    }

    @Test
    void deleteGroup_whenCallerIsNotOwner_doesNotInvokeRepository() {
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(sampleGroup(GROUP_ID)));
      when(eventApi.getEvent(eq(EVENT_ID), eq("intruder")))
          .thenThrow(new BusinessError("not_event_owner", "Not the event organiser"));

      assertThatThrownBy(() -> service.deleteGroup(GROUP_ID, "intruder"))
          .isInstanceOf(BusinessError.class);
      verify(groupRepository, never()).deleteById(any(String.class));
    }
  }

  @Nested
  class ChangeGuestGroup {

    private static final String NEW_GROUP_ID = "grp-2";

    @Test
    void changeGuestGroup_movesGuestToNewGroup_andClearsOldPrimaryIfApplicable() {
      verifyOwnershipPasses();
      GuestGroup oldGroup = sampleGroup(GROUP_ID).toBuilder().primaryGuestId(GUEST_ID).build();
      GuestGroup newGroup = sampleGroup(NEW_GROUP_ID);
      Guest current =
          sampleGuest(GUEST_ID, GROUP_ID).toBuilder().primary(true).updatedAt(null).build();
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(current));
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(oldGroup));
      when(groupRepository.findById(NEW_GROUP_ID)).thenReturn(Optional.of(newGroup));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));
      when(groupRepository.save(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));

      GuestDto result =
          service.changeGuestGroup(
              EVENT_ID, GUEST_ID, new ChangeGuestGroupDto(NEW_GROUP_ID), ORGANIZER_ID);

      assertThat(result.groupId()).isEqualTo(NEW_GROUP_ID);
      // Old group's primaryGuestId is cleared because the moved guest WAS its primary.
      ArgumentCaptor<GuestGroup> groupCaptor = ArgumentCaptor.forClass(GuestGroup.class);
      verify(groupRepository, times(1)).save(groupCaptor.capture());
      assertThat(groupCaptor.getValue().getPrimaryGuestId()).isNull();
      // The new group's primaryGuestId is NOT auto-promoted (caller can PATCH /guests/{id} if
      // needed).
      assertThat(newGroup.getPrimaryGuestId()).isNull();
    }

    @Test
    void changeGuestGroup_unassignsGuest_whenGroupIdIsNull() {
      verifyOwnershipPasses();
      GuestGroup oldGroup =
          sampleGroup(GROUP_ID).toBuilder().primaryGuestId("someone-else").build();
      Guest current = sampleGuest(GUEST_ID, GROUP_ID);
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(current));
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(oldGroup));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));

      GuestDto result =
          service.changeGuestGroup(EVENT_ID, GUEST_ID, new ChangeGuestGroupDto(null), ORGANIZER_ID);

      assertThat(result.groupId()).isNull();
      // The moved guest was NOT the primary of the old group -> group is not modified.
      verify(groupRepository, never()).save(any(GuestGroup.class));
    }

    @Test
    void changeGuestGroup_unassignsAndClearsPrimary_whenMovedGuestWasPrimary() {
      verifyOwnershipPasses();
      GuestGroup oldGroup = sampleGroup(GROUP_ID).toBuilder().primaryGuestId(GUEST_ID).build();
      Guest current = sampleGuest(GUEST_ID, GROUP_ID);
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(current));
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(oldGroup));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));
      when(groupRepository.save(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));

      GuestDto result =
          service.changeGuestGroup(EVENT_ID, GUEST_ID, new ChangeGuestGroupDto(null), ORGANIZER_ID);

      assertThat(result.groupId()).isNull();
      ArgumentCaptor<GuestGroup> groupCaptor = ArgumentCaptor.forClass(GuestGroup.class);
      verify(groupRepository, times(1)).save(groupCaptor.capture());
      assertThat(groupCaptor.getValue().getPrimaryGuestId()).isNull();
    }

    @Test
    void changeGuestGroup_isNoop_whenTargetEqualsCurrent() {
      verifyOwnershipPasses();
      Guest current = sampleGuest(GUEST_ID, GROUP_ID);
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(current));
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(sampleGroup(GROUP_ID)));

      GuestDto result =
          service.changeGuestGroup(
              EVENT_ID, GUEST_ID, new ChangeGuestGroupDto(GROUP_ID), ORGANIZER_ID);

      assertThat(result.groupId()).isEqualTo(GROUP_ID);
      verify(guestRepository, never()).save(any(Guest.class));
      verify(groupRepository, never()).save(any(GuestGroup.class));
    }

    @Test
    void changeGuestGroup_throwsResourceNotFound_whenTargetGroupBelongsToDifferentEvent() {
      verifyOwnershipPasses();
      Guest current = sampleGuest(GUEST_ID, GROUP_ID);
      GuestGroup oldGroup = sampleGroup(GROUP_ID);
      GuestGroup foreignGroup = sampleGroup(NEW_GROUP_ID).toBuilder().eventId("evt-other").build();
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(current));
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(oldGroup));
      when(groupRepository.findById(NEW_GROUP_ID)).thenReturn(Optional.of(foreignGroup));

      assertThatThrownBy(
              () ->
                  service.changeGuestGroup(
                      EVENT_ID, GUEST_ID, new ChangeGuestGroupDto(NEW_GROUP_ID), ORGANIZER_ID))
          .isInstanceOf(ResourceNotFoundError.class);
      verify(guestRepository, never()).save(any(Guest.class));
    }

    @Test
    void changeGuestGroup_throwsResourceNotFound_whenTargetGroupDoesNotExist() {
      verifyOwnershipPasses();
      Guest current = sampleGuest(GUEST_ID, GROUP_ID);
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(current));
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(sampleGroup(GROUP_ID)));
      when(groupRepository.findById(NEW_GROUP_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(
              () ->
                  service.changeGuestGroup(
                      EVENT_ID, GUEST_ID, new ChangeGuestGroupDto(NEW_GROUP_ID), ORGANIZER_ID))
          .isInstanceOf(ResourceNotFoundError.class);
    }
  }
}
