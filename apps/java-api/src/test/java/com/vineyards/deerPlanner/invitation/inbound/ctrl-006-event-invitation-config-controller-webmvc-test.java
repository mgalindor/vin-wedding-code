package com.vineyards.deerPlanner.invitation.inbound;

import com.vineyards.deerPlanner.events.facade.EventApi;
import com.vineyards.deerPlanner.invitation.facade.EventInvitationConfigApi;
import com.vineyards.deerPlanner.invitation.facade.dto.EventInvitationConfigDto;
import com.vineyards.deerPlanner.invitation.facade.dto.UpdateInvitationConfigDto;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticator;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
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

import java.time.OffsetDateTime;

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

@WebMvcTest(EventInvitationConfigController.class)
@AutoConfigureMockMvc
class Ctrl006EventInvitationConfigControllerSliceTest {

    private static final String ORGANIZER_ID = "user-organizer-1";
    private static final String EVENT_ID = "evt-1";

    @Autowired MockMvc mvc;

    @MockitoBean EventInvitationConfigApi configApi;
    @MockitoBean EventApi eventApi;
    @MockitoBean JwtAuthenticationFilter jwtAuthenticationFilter;
    @MockitoBean JwtAuthenticator jwtAuthenticator;
    @MockitoBean JwtDecoder jwtDecoder;

    @BeforeEach
    void passThroughJwtFilter() throws Exception {
        doAnswer(inv -> {
            FilterChain chain = inv.getArgument(2);
            chain.doFilter(
                (ServletRequest) inv.getArgument(0),
                (ServletResponse) inv.getArgument(1)
            );
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
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
            OffsetDateTime.parse("2026-08-15T10:00:00Z"),
            null,
            true,
            null,
            "emma-james-2026",
            OffsetDateTime.parse("2026-08-15T10:00:00Z")
        );
    }

    @Test
    void getInvitationConfig_returns200_andDelegatesToApi() throws Exception {
        when(configApi.getInvitationConfig(EVENT_ID, ORGANIZER_ID))
            .thenReturn(sampleConfig());

        mvc.perform(get("/api/v1/events/{id}/invitation-config", EVENT_ID)
                .with(authorizedUser()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.eventId").value(EVENT_ID))
            .andExpect(jsonPath("$.slug").value("emma-james-2026"))
            .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void putInvitationConfig_returns200_andAcceptsBody() throws Exception {
        when(configApi.updateInvitationConfig(eq(EVENT_ID), any(UpdateInvitationConfigDto.class), eq(ORGANIZER_ID)))
            .thenReturn(sampleConfig());

        String body = """
            {
              "slug": "emma-james-2026",
              "templateId": "tpl-wedding-romantic-v1",
              "active": true,
              "rsvpEnabled": true
            }
            """;

        MvcResult result = mvc.perform(put("/api/v1/events/{id}/invitation-config", EVENT_ID)
                .with(authorizedUser())
                .contentType("application/json")
                .content(body))
            .andExpect(status().isOk())
            .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("\"slug\":\"emma-james-2026\"");
    }

    @Test
    void putInvitationConfig_returns400_whenSlugIsUpperCase() throws Exception {
        String body = """
            {
              "slug": "Emma-James-2026",
              "active": true
            }
            """;

        mvc.perform(put("/api/v1/events/{id}/invitation-config", EVENT_ID)
                .with(authorizedUser())
                .contentType("application/json")
                .content(body))
            .andExpect(status().isBadRequest());
    }

    @Test
    void getInvitationConfig_returns404ProblemDetail_whenEventMissing() throws Exception {
        when(configApi.getInvitationConfig(eq("missing"), eq(ORGANIZER_ID)))
            .thenThrow(new com.vineyards.deerPlanner.events.domain.EventNotFoundException("missing"));

        mvc.perform(get("/api/v1/events/{id}/invitation-config", "missing")
                .with(authorizedUser()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("event_not_found"));
    }
}
