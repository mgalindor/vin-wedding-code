package com.vineyards.deerPlanner.invitation.inbound;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.invitation.facade.EventInvitationConfigInPort;
import com.vineyards.deerPlanner.invitation.facade.dto.EventInvitationConfigDto;
import com.vineyards.deerPlanner.invitation.facade.dto.UpdateInvitationConfigDto;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticatorInPort;
import com.vineyards.deerPlanner.shared.security.TokenBucketRateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(EventInvitationConfigController.class)
@AutoConfigureMockMvc
class EventInvitationConfigControllerTest {

  private static final String ORGANIZER_ID = "user-organizer-1";
  private static final String EVENT_ID = "evt-1";

  @Autowired MockMvc mvc;

  @MockitoBean EventInvitationConfigInPort configApi;
  @MockitoBean EventInPort eventApi;
  @MockitoBean JwtAuthenticationFilter jwtAuthenticationFilter;
  @MockitoBean JwtAuthenticatorInPort jwtAuthenticator;
  @MockitoBean JwtDecoder jwtDecoder;
  @MockitoBean TokenBucketRateLimiter rateLimiter;

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

  private EventInvitationConfigDto sampleConfig() {
    return new EventInvitationConfigDto(
        EVENT_ID,
        "tpl-wedding-romantic-v1",
        true,
        Instant.parse("2026-08-15T10:00:00Z"),
        null,
        true,
        null,
        "emma-james-2026",
        Instant.parse("2026-08-15T10:00:00Z"));
  }

  @Test
  void getInvitationConfig_whenConfigExists_returns200AndDelegatesToApi() throws Exception {
    when(configApi.getInvitationConfig(EVENT_ID, ORGANIZER_ID)).thenReturn(sampleConfig());

    mvc.perform(get("/api/v1/events/{id}/invitation-config", EVENT_ID).with(authorizedUser()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.eventId").value(EVENT_ID))
        .andExpect(jsonPath("$.slug").value("emma-james-2026"))
        .andExpect(jsonPath("$.active").value(true));
  }

  @Test
  void putInvitationConfig_withValidBody_returns200() throws Exception {
    when(configApi.updateInvitationConfig(
            eq(EVENT_ID), any(UpdateInvitationConfigDto.class), eq(ORGANIZER_ID)))
        .thenReturn(sampleConfig());

    String body =
        """
        {
          "slug": "emma-james-2026",
          "templateId": "tpl-wedding-romantic-v1",
          "active": true,
          "rsvpEnabled": true
        }
        """;

    MvcResult result =
        mvc.perform(
                put("/api/v1/events/{id}/invitation-config", EVENT_ID)
                    .with(authorizedUser())
                    .contentType("application/json")
                    .content(body))
            .andExpect(status().isOk())
            .andReturn();

    assertThat(result.getResponse().getContentAsString()).contains("\"slug\":\"emma-james-2026\"");
  }

  @Test
  void putInvitationConfig_whenSlugIsUpperCase_returns400() throws Exception {
    String body =
        """
        {
          "slug": "Emma-James-2026",
          "active": true
        }
        """;

    mvc.perform(
            put("/api/v1/events/{id}/invitation-config", EVENT_ID)
                .with(authorizedUser())
                .contentType("application/json")
                .content(body))
        .andExpect(status().isBadRequest());
  }

  @Test
  void getInvitationConfig_whenEventMissing_returns404ProblemDetail() throws Exception {
    when(configApi.getInvitationConfig(eq("missing"), eq(ORGANIZER_ID)))
        .thenThrow(
            new com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError(
                "event_not_found", "Event missing not found"));

    mvc.perform(get("/api/v1/events/{id}/invitation-config", "missing").with(authorizedUser()))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("event_not_found"));
  }
}
