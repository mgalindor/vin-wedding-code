package com.vineyards.deerPlanner.events.inbound;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vineyards.deerPlanner.events.facade.WeddingEventInPort;
import com.vineyards.deerPlanner.events.facade.dto.WeddingAccommodationPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDetailDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingGiftRegistryPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingLandingPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingParentsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingStoryPayloadDto;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticatorInPort;
import com.vineyards.deerPlanner.shared.security.TokenBucketRateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
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

@WebMvcTest(WeddingEventController.class)
@AutoConfigureMockMvc
class WeddingEventControllerTest {

  private static final String ORGANIZER_ID = "user-organizer-1";

  @Autowired MockMvc mvc;

  @MockitoBean WeddingEventInPort weddingApi;
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

  private WeddingDetailDto sampleDetail() {
    return new WeddingDetailDto("evt-1", "Maya", "Luis", true, null, null, null, null, null, null);
  }

  @Test
  void getWeddingDetail_returns200WithDetail() throws Exception {
    when(weddingApi.getWeddingDetail(eq("evt-1"))).thenReturn(sampleDetail());

    mvc.perform(get("/api/v1/events/{id}/wedding-detail", "evt-1").with(authorizedUser()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.eventId").value("evt-1"))
        .andExpect(jsonPath("$.partner1Name").value("Maya"))
        .andExpect(jsonPath("$.partner2Name").value("Luis"))
        .andExpect(jsonPath("$.countdownEnabled").value(true));
  }

  @Test
  void putWeddingDetail_withPartialPayload_returns200() throws Exception {
    when(weddingApi.updateWeddingDetail(eq("evt-1"), any())).thenReturn(sampleDetail());

    mvc.perform(
            put("/api/v1/events/{id}/wedding-detail", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"partner1Name": "Maya", "countdownEnabled": false}
                    """))
        .andExpect(status().isOk());
  }

  @Test
  void putWeddingLanding_withValidPayload_returns200() throws Exception {
    when(weddingApi.updateWeddingLanding(eq("evt-1"), any(WeddingLandingPayloadDto.class)))
        .thenReturn(sampleDetail());

    mvc.perform(
            put("/api/v1/events/{id}/wedding-landing", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"preTitle": "You are cordially invited"}
                    """))
        .andExpect(status().isOk());
  }

  @Test
  void putWeddingStory_whenBodyBlank_returns400() throws Exception {
    mvc.perform(
            put("/api/v1/events/{id}/wedding-story", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"body": ""}
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void putWeddingStory_whenBodyPresent_returns200() throws Exception {
    when(weddingApi.updateWeddingStory(eq("evt-1"), any(WeddingStoryPayloadDto.class)))
        .thenReturn(sampleDetail());

    mvc.perform(
            put("/api/v1/events/{id}/wedding-story", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"body": "We met in college eight years ago..."}
                    """))
        .andExpect(status().isOk());
  }

  @Test
  void putWeddingDressCode_whenEntriesEmpty_returns400() throws Exception {
    mvc.perform(
            put("/api/v1/events/{id}/wedding-dress-code", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"entries": []}
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void putWeddingGiftRegistry_withValidPayload_returns200() throws Exception {
    when(weddingApi.updateWeddingGiftRegistry(
            eq("evt-1"), any(WeddingGiftRegistryPayloadDto.class)))
        .thenReturn(sampleDetail());

    mvc.perform(
            put("/api/v1/events/{id}/wedding-gift-registry", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "links": [
                        {"label": "Liverpool", "url": "https://liverpool.com.mx/emma"}
                      ],
                      "notes": "BBVA 1234567890"
                    }
                    """))
        .andExpect(status().isOk());
  }

  @Test
  void putWeddingParents_withValidPayload_returns200() throws Exception {
    when(weddingApi.updateWeddingParents(eq("evt-1"), any(WeddingParentsPayloadDto.class)))
        .thenReturn(sampleDetail());

    mvc.perform(
            put("/api/v1/events/{id}/wedding-parents", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "partner1Label": "Padres de la Novia",
                      "partner1Names": ["Roberto Garcia", "Maria Lopez"]
                    }
                    """))
        .andExpect(status().isOk());
  }

  @Test
  void putWeddingAccommodation_withValidPayload_returns200() throws Exception {
    when(weddingApi.updateWeddingAccommodation(
            eq("evt-1"), any(WeddingAccommodationPayloadDto.class)))
        .thenReturn(sampleDetail());

    mvc.perform(
            put("/api/v1/events/{id}/wedding-accommodation", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "entries": [
                        {"name": "Hotel Boutique Casa Blanca", "priceHint": "$1,800 MXN/noche"}
                      ]
                    }
                    """))
        .andExpect(status().isOk());
  }

  @Test
  void putWeddingPayload_whenBodyIsMalformedJson_returns400() throws Exception {
    mvc.perform(
            put("/api/v1/events/{id}/wedding-accommodation", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{not-json}"))
        .andExpect(status().isBadRequest());
  }
}
