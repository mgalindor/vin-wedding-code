package com.vineyards.deerPlanner.guests.inbound;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
import com.vineyards.deerPlanner.guests.facade.GuestInPort;
import com.vineyards.deerPlanner.guests.facade.dto.ChangeGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.PagedGuestsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.RsvpUpdateDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestDto;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticatorInPort;
import com.vineyards.deerPlanner.shared.security.TokenBucketRateLimiter;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(GuestsController.class)
@AutoConfigureMockMvc
class GuestsControllerTest {

  private static final String ORGANIZER_ID = "user-organizer-1";
  private static final String EVENT_ID = "evt-1";
  private static final String GROUP_ID = "grp-1";
  private static final String GUEST_ID = "gst-1";

  @Autowired MockMvc mvc;

  @MockitoBean GuestInPort guestApi;
  @MockitoBean EventInPort eventApi;
  @MockitoBean JwtAuthenticationFilter jwtAuthenticationFilter;
  @MockitoBean TokenBucketRateLimiter rateLimiter;
  @MockitoBean JwtAuthenticatorInPort jwtAuthenticator;
  @MockitoBean JwtDecoder jwtDecoder;

  @BeforeEach
  void passThroughJwtFilter() throws Exception {
    doAnswer(
            inv -> {
              FilterChain chain = inv.getArgument(2);
              chain.doFilter(
                  (ServletRequest) inv.getArgument(0), (ServletResponse) inv.getArgument(1));
              return null;
            })
        .when(jwtAuthenticationFilter)
        .doFilter(any(), any(), any());
  }

  private org.springframework.test.web.servlet.request.RequestPostProcessor authorizedUser() {
    return jwt()
        .jwt(j -> j.subject(ORGANIZER_ID))
        .authorities(new SimpleGrantedAuthority("ROLE_EventOrganizer"));
  }

  private GuestDto sampleGuest() {
    return new GuestDto(
        GUEST_ID,
        GROUP_ID,
        "Maria",
        "Morales",
        "maria@example.com",
        "+521111111111",
        null,
        "token-guest",
        "pending",
        null,
        null,
        null,
        Instant.parse("2026-08-01T10:00:00Z"),
        Instant.parse("2026-08-01T10:00:00Z"));
  }

  @Test
  void listGuests_whenGuestsExist_returns200AndRootedItems() throws Exception {
    when(guestApi.listGuests(
            org.mockito.ArgumentMatchers.eq(EVENT_ID),
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.eq(ORGANIZER_ID),
            any(org.springframework.data.domain.Pageable.class)))
        .thenReturn(
            new PagedGuestsResponse(
                new PagedResponse<>(List.of(sampleGuest()), 0, 50, 1, 1, false)));

    mvc.perform(get("/api/v1/events/{id}/guests", EVENT_ID).with(authorizedUser()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.page.items").isArray())
        .andExpect(jsonPath("$.page.items[0].id").value(GUEST_ID))
        .andExpect(jsonPath("$.page.items[0].firstName").value("Maria"))
        .andExpect(jsonPath("$.page.items[0].rsvpStatus").value("pending"))
        .andExpect(jsonPath("$.page.total").value(1));
  }

  @Test
  void getGuest_whenGuestMissing_returns404() throws Exception {
    when(guestApi.getGuest(eq("missing"), eq(ORGANIZER_ID)))
        .thenThrow(new ResourceNotFoundError("guest_not_found", "Guest missing not found"));

    mvc.perform(
            get("/api/v1/events/{eid}/guests/{gid}", EVENT_ID, "missing").with(authorizedUser()))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("guest_not_found"));
  }

  @Test
  void postGuest_withValidBody_returns201WithLocation() throws Exception {
    when(guestApi.createGuest(eq(EVENT_ID), any(CreateGuestDto.class), eq(ORGANIZER_ID)))
        .thenReturn(sampleGuest());

    String body =
        """
        {
          "groupId": "grp-1",
          "firstName": "Maria",
          "lastName": "Morales",
          "email": "maria@example.com",
          "phone": "+521111111111"
        }
        """;

    mvc.perform(
            post("/api/v1/events/{id}/guests", EVENT_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(GUEST_ID))
        .andExpect(jsonPath("$.groupId").value(GROUP_ID));
  }

  @Test
  void postGuest_whenFirstNameBlank_returns400() throws Exception {
    mvc.perform(
            post("/api/v1/events/{id}/guests", EVENT_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"groupId": "grp-1", "lastName": "Morales"}
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void postGuest_whenGroupIdMissing_returns400() throws Exception {
    // groupId is @NotBlank — required so the service can place the guest in the right group.
    mvc.perform(
            post("/api/v1/events/{id}/guests", EVENT_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"firstName": "Maria", "lastName": "Morales"}
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void patchGuest_withValidBody_returns200WithUpdatedName() throws Exception {
    GuestDto updated =
        new GuestDto(
            GUEST_ID,
            GROUP_ID,
            "María José",
            "Morales",
            null,
            null,
            null,
            "token-guest",
            "pending",
            null,
            null,
            null,
            Instant.parse("2026-08-01T10:00:00Z"),
            Instant.parse("2026-08-02T10:00:00Z"));
    when(guestApi.updateGuest(eq(GUEST_ID), any(UpdateGuestDto.class), eq(ORGANIZER_ID)))
        .thenReturn(updated);

    mvc.perform(
            patch("/api/v1/events/{eid}/guests/{gid}", EVENT_ID, GUEST_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"firstName": "María José"}
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.firstName").value("María José"));
  }

  @Test
  void deleteGuest_whenGuestExists_returns204() throws Exception {
    mvc.perform(
            delete("/api/v1/events/{eid}/guests/{gid}", EVENT_ID, GUEST_ID).with(authorizedUser()))
        .andExpect(status().isNoContent());

    verify(guestApi).deleteGuest(eq(GUEST_ID), eq(ORGANIZER_ID));
  }

  @Test
  void patchGroup_withNewGroupId_returns200AndDelegates() throws Exception {
    GuestDto moved =
        new GuestDto(
            GUEST_ID,
            "grp-2",
            "Maria",
            "Morales",
            "maria@example.com",
            "+521111111111",
            null,
            "token-guest",
            "pending",
            null,
            null,
            null,
            Instant.parse("2026-08-01T10:00:00Z"),
            Instant.parse("2026-08-02T10:00:00Z"));
    when(guestApi.changeGuestGroup(
            eq(EVENT_ID), eq(GUEST_ID), any(ChangeGuestGroupDto.class), eq(ORGANIZER_ID)))
        .thenReturn(moved);

    mvc.perform(
            patch("/api/v1/events/{eid}/guests/{gid}/group", EVENT_ID, GUEST_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"groupId\":\"grp-2\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.groupId").value("grp-2"));

    ArgumentCaptor<ChangeGuestGroupDto> captor = ArgumentCaptor.forClass(ChangeGuestGroupDto.class);
    verify(guestApi)
        .changeGuestGroup(eq(EVENT_ID), eq(GUEST_ID), captor.capture(), eq(ORGANIZER_ID));
    assertThat(captor.getValue().groupId()).isEqualTo("grp-2");
  }

  @Test
  void patchGroup_withNullGroupId_unassigns() throws Exception {
    GuestDto unassigned =
        new GuestDto(
            GUEST_ID,
            null,
            "Maria",
            "Morales",
            "maria@example.com",
            "+521111111111",
            null,
            "token-guest",
            "pending",
            null,
            null,
            null,
            Instant.parse("2026-08-01T10:00:00Z"),
            Instant.parse("2026-08-02T10:00:00Z"));
    when(guestApi.changeGuestGroup(
            eq(EVENT_ID), eq(GUEST_ID), any(ChangeGuestGroupDto.class), eq(ORGANIZER_ID)))
        .thenReturn(unassigned);

    mvc.perform(
            patch("/api/v1/events/{eid}/guests/{gid}/group", EVENT_ID, GUEST_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"groupId\":null}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.groupId").doesNotExist());

    ArgumentCaptor<ChangeGuestGroupDto> captor = ArgumentCaptor.forClass(ChangeGuestGroupDto.class);
    verify(guestApi)
        .changeGuestGroup(eq(EVENT_ID), eq(GUEST_ID), captor.capture(), eq(ORGANIZER_ID));
    assertThat(captor.getValue().groupId()).isNull();
  }

  // ----- Admin RSVP (individual) -----

  @Test
  void putGuestRsvp_withConfirmedStatus_returns200() throws Exception {
    GuestDto updated =
        new GuestDto(
            GUEST_ID,
            GROUP_ID,
            "Maria",
            "Morales",
            null,
            null,
            null,
            "token-guest",
            "confirmed",
            Instant.parse("2026-09-01T10:00:00Z"),
            null,
            null,
            Instant.parse("2026-08-01T10:00:00Z"),
            Instant.parse("2026-09-01T10:00:00Z"));
    when(guestApi.markGuestRsvp(eq(GUEST_ID), any(RsvpUpdateDto.class), eq(ORGANIZER_ID)))
        .thenReturn(updated);

    mvc.perform(
            put("/api/v1/events/{eid}/guests/{gid}/rsvp", EVENT_ID, GUEST_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"status": "confirmed", "message": "All set"}
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.rsvpStatus").value("confirmed"));

    ArgumentCaptor<RsvpUpdateDto> captor = ArgumentCaptor.forClass(RsvpUpdateDto.class);
    verify(guestApi).markGuestRsvp(eq(GUEST_ID), captor.capture(), eq(ORGANIZER_ID));
    assertThat(captor.getValue().status()).isEqualTo(RsvpStatus.confirmed);
    assertThat(captor.getValue().message()).isEqualTo("All set");
  }

  @Test
  void putGuestRsvp_whenStatusMissing_returns400() throws Exception {
    mvc.perform(
            put("/api/v1/events/{eid}/guests/{gid}/rsvp", EVENT_ID, GUEST_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"message": "no status"}
                    """))
        .andExpect(status().isBadRequest());
  }
}
