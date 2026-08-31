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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.guests.facade.GuestInPort;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestGroupsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupDto;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticatorInPort;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
        "Novia",
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
  void postGroup_withValidBody_returns201WithLocation() throws Exception {
    when(guestApi.createGroup(eq(EVENT_ID), any(CreateGuestGroupDto.class), eq(ORGANIZER_ID)))
        .thenReturn(sampleGroup());

    String body =
        """
        {
          "name": "Familia Morales",
          "side": "Novia",
          "relationship": "family",
          "sharedEmail": "fm@example.com",
          "sharedPhone": "+521234567890",
          "displayOrder": 0
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
  }

  @Test
  void postGroup_whenNameBlank_returns400() throws Exception {
    mvc.perform(
            post("/api/v1/events/{id}/guest-groups", EVENT_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"side": "Novia", "relationship": "family"}
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
            "Novia",
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
            "Novia",
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
}
