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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
import com.vineyards.deerPlanner.guests.facade.GuestInPort;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestGroupsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.RsvpUpdateDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupPrimaryDto;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticatorInPort;
import com.vineyards.deerPlanner.shared.security.TokenBucketRateLimiter;
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
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(GuestGroupsController.class)
@AutoConfigureMockMvc
class GuestGroupsControllerTest {

  private static final String ORGANIZER_ID = "user-organizer-1";
  private static final String EVENT_ID = "evt-1";
  private static final String GROUP_ID = "grp-1";

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

  private GuestGroupDto sampleGroup() {
    return new GuestGroupDto(
        GROUP_ID,
        EVENT_ID,
        "Familia Morales",
        "family",
        "fm@example.com",
        "+521234567890",
        null,
        "token-1",
        0,
        Instant.parse("2026-08-01T10:00:00Z"),
        Instant.parse("2026-08-01T10:00:00Z"));
  }

  @Test
  void listGroups_whenGroupsExist_returns200AndRootedItems() throws Exception {
    when(guestApi.listGroups(EVENT_ID, ORGANIZER_ID))
        .thenReturn(new ListGuestGroupsResponse(List.of(sampleGroup()), 1));

    mvc.perform(get("/api/v1/events/{id}/guest-groups", EVENT_ID).with(authorizedUser()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items").isArray())
        .andExpect(jsonPath("$.items[0].id").value(GROUP_ID))
        .andExpect(jsonPath("$.items[0].relationship").value("family"))
        .andExpect(jsonPath("$.total").value(1));
  }

  @Test
  void getGroup_whenGroupMissing_returns404() throws Exception {
    when(guestApi.getGroup(eq("missing"), eq(ORGANIZER_ID)))
        .thenThrow(
            new ResourceNotFoundError("guest_group_not_found", "Guest group missing not found"));

    mvc.perform(
            get("/api/v1/events/{eid}/guest-groups/{gid}", EVENT_ID, "missing")
                .with(authorizedUser()))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("guest_group_not_found"));
  }

  @Test
  void postGroup_withInlineGuestsAndPrimary_returns201AndDelegatesFullPayload() throws Exception {
    when(guestApi.createGroup(eq(EVENT_ID), any(CreateGuestGroupDto.class), eq(ORGANIZER_ID)))
        .thenReturn(sampleGroup());

    String body =
        """
        {
          "name": "Familia Morales",
          "relationship": "family",
          "guests": [
            {"fullName": "Maria Morales", "primary": true},
            {"fullName": "Jose Morales"}
          ]
        }
        """;

    MvcResult result =
        mvc.perform(
                post("/api/v1/events/{id}/guest-groups", EVENT_ID)
                    .with(authorizedUser())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.id").value(GROUP_ID))
            .andReturn();

    assertThat(result.getResponse().getHeader("Location")).contains("/guest-groups/" + GROUP_ID);

    ArgumentCaptor<CreateGuestGroupDto> captor = ArgumentCaptor.forClass(CreateGuestGroupDto.class);
    verify(guestApi).createGroup(eq(EVENT_ID), captor.capture(), eq(ORGANIZER_ID));
    assertThat(captor.getValue().guests())
        .hasSize(2)
        .extracting("fullName")
        .containsExactly("Maria Morales", "Jose Morales");
    assertThat(captor.getValue().guests().get(0).primary()).isTrue();
    assertThat(captor.getValue().guests().get(1).primary()).isNull();
  }

  @Test
  void postGroup_whenInlineGuestMissingFullName_returns400() throws Exception {
    mvc.perform(
            post("/api/v1/events/{id}/guest-groups", EVENT_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "Familia Morales",
                      "relationship": "family",
                      "guests": [{"primary": true}]
                    }
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void postGroup_whenNameBlank_returns400() throws Exception {
    mvc.perform(
            post("/api/v1/events/{id}/guest-groups", EVENT_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"relationship": "family"}
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void postGroup_whenRelationshipIsInvalid_returns400() throws Exception {
    mvc.perform(
            post("/api/v1/events/{id}/guest-groups", EVENT_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name": "X", "relationship": "stranger"}
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void patchGroup_withValidBody_returns200WithUpdatedName() throws Exception {
    GuestGroupDto updated =
        new GuestGroupDto(
            GROUP_ID,
            EVENT_ID,
            "Familia Morales (Updated)",
            "family",
            null,
            null,
            null,
            "token-1",
            0,
            Instant.parse("2026-08-01T10:00:00Z"),
            Instant.parse("2026-08-02T10:00:00Z"));
    when(guestApi.updateGroup(eq(GROUP_ID), any(UpdateGuestGroupDto.class), eq(ORGANIZER_ID)))
        .thenReturn(updated);

    mvc.perform(
            patch("/api/v1/events/{eid}/guest-groups/{gid}", EVENT_ID, GROUP_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name": "Familia Morales (Updated)"}
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Familia Morales (Updated)"));
  }

  @Test
  void deleteGroup_whenGroupExists_returns204() throws Exception {
    mvc.perform(
            delete("/api/v1/events/{eid}/guest-groups/{gid}", EVENT_ID, GROUP_ID)
                .with(authorizedUser()))
        .andExpect(status().isNoContent());

    verify(guestApi).deleteGroup(eq(GROUP_ID), eq(ORGANIZER_ID));
  }

  @Test
  void regenerateToken_whenCalled_returns200WithNewToken() throws Exception {
    GuestGroupDto rotated =
        new GuestGroupDto(
            GROUP_ID,
            EVENT_ID,
            "Familia Morales",
            "family",
            null,
            null,
            null,
            "rotated-token",
            0,
            Instant.parse("2026-08-01T10:00:00Z"),
            Instant.parse("2026-08-02T10:00:00Z"));
    when(guestApi.regenerateGroupToken(eq(GROUP_ID), eq(ORGANIZER_ID))).thenReturn(rotated);

    mvc.perform(
            post("/api/v1/events/{eid}/guest-groups/{gid}/regenerate-token", EVENT_ID, GROUP_ID)
                .with(authorizedUser()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.invitationToken").value("rotated-token"));
  }

  // ----- Primary contact setter -----

  @Test
  void putPrimary_withGuestId_setsPrimary() throws Exception {
    GuestGroupDto updated =
        new GuestGroupDto(
            GROUP_ID,
            EVENT_ID,
            "Familia Morales",
            "family",
            null,
            null,
            "gst-1",
            "token-1",
            0,
            Instant.parse("2026-08-01T10:00:00Z"),
            Instant.parse("2026-09-01T10:00:00Z"));
    when(guestApi.updatePrimaryGuest(
            eq(GROUP_ID), any(UpdateGuestGroupPrimaryDto.class), eq(ORGANIZER_ID)))
        .thenReturn(updated);

    mvc.perform(
            put("/api/v1/events/{eid}/guest-groups/{gid}/primary", EVENT_ID, GROUP_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"guestId\":\"gst-1\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.primaryGuestId").value("gst-1"));

    ArgumentCaptor<UpdateGuestGroupPrimaryDto> captor =
        ArgumentCaptor.forClass(UpdateGuestGroupPrimaryDto.class);
    verify(guestApi).updatePrimaryGuest(eq(GROUP_ID), captor.capture(), eq(ORGANIZER_ID));
    assertThat(captor.getValue().guestId()).isEqualTo("gst-1");
  }

  @Test
  void putPrimary_withNullGuest_clearsPrimary() throws Exception {
    GuestGroupDto cleared =
        new GuestGroupDto(
            GROUP_ID,
            EVENT_ID,
            "Familia Morales",
            "family",
            null,
            null,
            null,
            "token-1",
            0,
            Instant.parse("2026-08-01T10:00:00Z"),
            Instant.parse("2026-09-01T10:00:00Z"));
    when(guestApi.updatePrimaryGuest(
            eq(GROUP_ID), any(UpdateGuestGroupPrimaryDto.class), eq(ORGANIZER_ID)))
        .thenReturn(cleared);

    mvc.perform(
            put("/api/v1/events/{eid}/guest-groups/{gid}/primary", EVENT_ID, GROUP_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"guestId\":null}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.primaryGuestId").doesNotExist());
  }

  // ----- Admin RSVP (whole group) -----

  @Test
  void putGroupRsvp_withConfirmedStatus_returns200AndDelegates() throws Exception {
    when(guestApi.markGroupRsvp(eq(GROUP_ID), any(RsvpUpdateDto.class), eq(ORGANIZER_ID)))
        .thenReturn(sampleGroup());

    mvc.perform(
            put("/api/v1/events/{eid}/guest-groups/{gid}/rsvp", EVENT_ID, GROUP_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"status": "confirmed", "message": "All confirmed"}
                    """))
        .andExpect(status().isOk());

    ArgumentCaptor<RsvpUpdateDto> captor = ArgumentCaptor.forClass(RsvpUpdateDto.class);
    verify(guestApi).markGroupRsvp(eq(GROUP_ID), captor.capture(), eq(ORGANIZER_ID));
    assertThat(captor.getValue().status()).isEqualTo(RsvpStatus.confirmed);
    assertThat(captor.getValue().message()).isEqualTo("All confirmed");
  }

  @Test
  void putGroupRsvp_whenStatusMissing_returns400() throws Exception {
    mvc.perform(
            put("/api/v1/events/{eid}/guest-groups/{gid}/rsvp", EVENT_ID, GROUP_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"message": "no status"}
                    """))
        .andExpect(status().isBadRequest());
  }
}
