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
import com.vineyards.deerPlanner.guests.facade.dto.RsvpUpdateDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupPrimaryDto;
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
  @Mock org.springframework.context.ApplicationEventPublisher publisher;

  GuestService service;

  @BeforeEach
  void setUp() {
    service = new GuestService(groupRepository, guestRepository, eventApi, publisher);
  }

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
    when(eventApi.getEvent(eq(EVENT_ID)))
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
      when(eventApi.getEvent(eq(EVENT_ID)))
          .thenThrow(new BusinessError("not_event_owner", "Not the event organiser"));

      assertThatThrownBy(() -> service.listGroups(EVENT_ID, "intruder"))
          .isInstanceOf(BusinessError.class);
    }
  }

  @Nested
  class CreateGroup {

    @Test
    void createGroup_whenNoInlineGuests_throwsPrimaryRequired() {
      verifyOwnershipPasses();
      var dto = new CreateGuestGroupDto("Familia Morales", "family", null, null, 0, null);

      assertThatThrownBy(() -> service.createGroup(EVENT_ID, dto, ORGANIZER_ID))
          .isInstanceOf(BusinessError.class)
          .hasMessageContaining("primary_guest_required");
      verify(groupRepository, never()).create(any(GuestGroup.class));
      verify(groupRepository, never()).update(any(GuestGroup.class));
      verify(guestRepository, never()).save(any(Guest.class));
    }

    @Test
    void createGroup_whenNoPrimaryMarked_throwsPrimaryRequired() {
      verifyOwnershipPasses();
      var maria = new InlineGuestDto("Maria", "Morales", null, null, null, null);
      var jose = new InlineGuestDto("Jose", "Morales", null, null, null, null);
      var dto =
          new CreateGuestGroupDto("Familia Morales", "family", null, null, 0, List.of(maria, jose));

      assertThatThrownBy(() -> service.createGroup(EVENT_ID, dto, ORGANIZER_ID))
          .isInstanceOf(BusinessError.class)
          .hasMessageContaining("primary_guest_required");
    }

    @Test
    void createGroup_whenMultiplePrimariesMarked_throwsMultiplePrimaryGuests() {
      verifyOwnershipPasses();
      var maria = new InlineGuestDto("Maria", "Morales", null, null, null, true);
      var jose = new InlineGuestDto("Jose", "Morales", null, null, null, true);
      var dto =
          new CreateGuestGroupDto("Familia Morales", "family", null, null, 0, List.of(maria, jose));

      assertThatThrownBy(() -> service.createGroup(EVENT_ID, dto, ORGANIZER_ID))
          .isInstanceOf(BusinessError.class)
          .hasMessageContaining("multiple_primary_guests");
    }

    @Test
    void createGroup_withExactlyOnePrimary_setsPrimaryGuestIdToThatGuest() {
      verifyOwnershipPasses();
      when(groupRepository.create(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));
      when(groupRepository.update(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));

      var maria = new InlineGuestDto("Maria", "Morales", null, null, null, null);
      var jose = new InlineGuestDto("Jose", "Morales", null, null, null, true); // primary
      var luis = new InlineGuestDto("Luis", "Morales", null, null, null, null);
      var dto =
          new CreateGuestGroupDto(
              "Familia Morales", "family", null, null, 0, List.of(maria, jose, luis));

      GuestGroupDto result = service.createGroup(EVENT_ID, dto, ORGANIZER_ID);

      ArgumentCaptor<Guest> captor = ArgumentCaptor.forClass(Guest.class);
      verify(guestRepository, times(3)).save(captor.capture());
      Guest joseSaved =
          captor.getAllValues().stream()
              .filter(g -> "Jose".equals(g.getFirstName()))
              .findFirst()
              .orElseThrow();
      assertThat(result.primaryGuestId()).isEqualTo(joseSaved.getId());
    }
  }

  @Nested
  class TokenRotation {

    @Test
    void regenerateGroupToken_whenGroupExists_issuesNewUuid() {
      verifyOwnershipPasses();
      GuestGroup current = sampleGroup(GROUP_ID);
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(current));
      when(groupRepository.update(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));

      GuestGroupDto result = service.regenerateGroupToken(GROUP_ID, ORGANIZER_ID);

      assertThat(result.invitationToken()).isNotEqualTo(current.getInvitationToken());
    }
  }

  @Nested
  class PrimaryGuestUpdate {

    @Test
    void updatePrimaryGuest_withValidGuest_setsPrimaryAndReturnsGroup() {
      verifyOwnershipPasses();
      GuestGroup group = sampleGroup(GROUP_ID);
      Guest guest = sampleGuest(GUEST_ID, GROUP_ID);
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(guest));
      when(groupRepository.update(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));

      GuestGroupDto result =
          service.updatePrimaryGuest(
              GROUP_ID, new UpdateGuestGroupPrimaryDto(GUEST_ID), ORGANIZER_ID);

      assertThat(result.primaryGuestId()).isEqualTo(GUEST_ID);
    }

    @Test
    void updatePrimaryGuest_withNullGuest_clearsPrimary() {
      verifyOwnershipPasses();
      GuestGroup group = sampleGroup(GROUP_ID).toBuilder().primaryGuestId("someone").build();
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
      when(groupRepository.update(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));

      GuestGroupDto result =
          service.updatePrimaryGuest(GROUP_ID, new UpdateGuestGroupPrimaryDto(null), ORGANIZER_ID);

      assertThat(result.primaryGuestId()).isNull();
    }

    @Test
    void updatePrimaryGuest_whenGuestInOtherGroup_throwsBusinessError() {
      verifyOwnershipPasses();
      GuestGroup group = sampleGroup(GROUP_ID);
      Guest otherGroupGuest = sampleGuest(GUEST_ID, "grp-other");
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(otherGroupGuest));

      assertThatThrownBy(
              () ->
                  service.updatePrimaryGuest(
                      GROUP_ID, new UpdateGuestGroupPrimaryDto(GUEST_ID), ORGANIZER_ID))
          .isInstanceOf(BusinessError.class)
          .hasMessageContaining("guest_not_in_group");
    }
  }

  @Nested
  class CreateGuest {

    @Test
    void createGuest_whenGroupDoesNotExist_throwsResourceNotFound() {
      verifyOwnershipPasses();
      when(groupRepository.findById("grp-missing")).thenReturn(Optional.empty());

      var dto = new CreateGuestDto("grp-missing", "Maria", "Morales", null, null, null);

      assertThatThrownBy(() -> service.createGuest(EVENT_ID, dto, ORGANIZER_ID))
          .isInstanceOf(ResourceNotFoundError.class);
    }

    @Test
    void createGuest_withValidDto_persistsAndDefaultsRsvpToPending() {
      verifyOwnershipPasses();
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(sampleGroup(GROUP_ID)));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));

      var dto = new CreateGuestDto(GROUP_ID, "Maria", "Morales", null, null, null);

      GuestDto result = service.createGuest(EVENT_ID, dto, ORGANIZER_ID);

      assertThat(result.rsvpStatus()).isEqualTo("pending");
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
      when(eventApi.getEvent(eq(EVENT_ID)))
          .thenThrow(
              new ResourceNotFoundError("event_not_found", "Event " + EVENT_ID + " not found"));

      assertThatThrownBy(
              () ->
                  service.listGuests(
                      EVENT_ID,
                      null,
                      null,
                      null,
                      ORGANIZER_ID,
                      org.springframework.data.domain.Pageable.unpaged()))
          .isInstanceOf(ResourceNotFoundError.class);
    }

    @Test
    void deleteGroup_whenCallerIsNotOwner_doesNotInvokeRepository() {
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(sampleGroup(GROUP_ID)));
      when(eventApi.getEvent(eq(EVENT_ID)))
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
      Guest current = sampleGuest(GUEST_ID, GROUP_ID).toBuilder().updatedAt(null).build();
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(current));
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(oldGroup));
      when(groupRepository.findById(NEW_GROUP_ID)).thenReturn(Optional.of(newGroup));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));
      when(groupRepository.update(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));

      GuestDto result =
          service.changeGuestGroup(
              EVENT_ID, GUEST_ID, new ChangeGuestGroupDto(NEW_GROUP_ID), ORGANIZER_ID);

      assertThat(result.groupId()).isEqualTo(NEW_GROUP_ID);
      ArgumentCaptor<GuestGroup> groupCaptor = ArgumentCaptor.forClass(GuestGroup.class);
      verify(groupRepository, times(1)).update(groupCaptor.capture());
      assertThat(groupCaptor.getValue().getPrimaryGuestId()).isNull();
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
      verify(groupRepository, never()).update(any(GuestGroup.class));
    }

    @Test
    void changeGuestGroup_unassignsAndClearsPrimary_whenMovedGuestWasPrimary() {
      verifyOwnershipPasses();
      GuestGroup oldGroup = sampleGroup(GROUP_ID).toBuilder().primaryGuestId(GUEST_ID).build();
      Guest current = sampleGuest(GUEST_ID, GROUP_ID);
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(current));
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(oldGroup));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));
      when(groupRepository.update(any(GuestGroup.class))).thenAnswer(inv -> inv.getArgument(0));

      GuestDto result =
          service.changeGuestGroup(EVENT_ID, GUEST_ID, new ChangeGuestGroupDto(null), ORGANIZER_ID);

      assertThat(result.groupId()).isNull();
      ArgumentCaptor<GuestGroup> groupCaptor = ArgumentCaptor.forClass(GuestGroup.class);
      verify(groupRepository, times(1)).update(groupCaptor.capture());
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
      verify(groupRepository, never()).update(any(GuestGroup.class));
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

  @Nested
  class AdminRsvp {

    @Test
    void markGroupRsvp_confirmed_setsAllGuestsToConfirmedWithTimestamp() {
      verifyOwnershipPasses();
      GuestGroup group = sampleGroup(GROUP_ID);
      Guest maria = sampleGuest(GUEST_ID, GROUP_ID);
      Guest jose = sampleGuest("gst-2", GROUP_ID);
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
      when(guestRepository.findByGroupId(GROUP_ID)).thenReturn(List.of(maria, jose));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));

      var dto = new RsvpUpdateDto(RsvpStatus.confirmed, "All confirmed");
      service.markGroupRsvp(GROUP_ID, dto, ORGANIZER_ID);

      ArgumentCaptor<Guest> captor = ArgumentCaptor.forClass(Guest.class);
      verify(guestRepository, times(2)).save(captor.capture());
      assertThat(captor.getAllValues())
          .extracting(Guest::getRsvpStatus)
          .containsOnly(RsvpStatus.confirmed);
      assertThat(captor.getAllValues()).allMatch(g -> g.getRsvpConfirmedAt() != null);
    }

    @Test
    void markGuestRsvp_declined_setsSingleGuestAndClearsTimestampOnPendingReset() {
      verifyOwnershipPasses();
      Guest current = sampleGuest(GUEST_ID, GROUP_ID);
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(current));
      when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(sampleGroup(GROUP_ID)));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));

      service.markGuestRsvp(GUEST_ID, new RsvpUpdateDto(RsvpStatus.declined, null), ORGANIZER_ID);

      ArgumentCaptor<Guest> captor = ArgumentCaptor.forClass(Guest.class);
      verify(guestRepository).save(captor.capture());
      Guest saved = captor.getValue();
      assertThat(saved.getRsvpStatus()).isEqualTo(RsvpStatus.declined);
      assertThat(saved.getRsvpMessage()).isNull();

      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(saved));
      service.markGuestRsvp(GUEST_ID, new RsvpUpdateDto(RsvpStatus.pending, null), ORGANIZER_ID);

      ArgumentCaptor<Guest> captor2 = ArgumentCaptor.forClass(Guest.class);
      verify(guestRepository, times(2)).save(captor2.capture());
      Guest reset = captor2.getAllValues().get(1);
      assertThat(reset.getRsvpStatus()).isEqualTo(RsvpStatus.pending);
      assertThat(reset.getRsvpConfirmedAt()).isNull();
    }

    @Test
    void applyRsvpFromInvitation_writesWithoutOwnershipCheck() {
      Guest current = sampleGuest(GUEST_ID, GROUP_ID);
      when(guestRepository.findById(GUEST_ID)).thenReturn(Optional.of(current));
      when(guestRepository.save(any(Guest.class))).thenAnswer(inv -> inv.getArgument(0));

      GuestDto result =
          service.applyRsvpFromInvitation(
              GUEST_ID, new RsvpUpdateDto(RsvpStatus.confirmed, "Looking forward"));

      assertThat(result.rsvpStatus()).isEqualTo("confirmed");
      assertThat(result.rsvpMessage()).isEqualTo("Looking forward");
    }
  }
}
