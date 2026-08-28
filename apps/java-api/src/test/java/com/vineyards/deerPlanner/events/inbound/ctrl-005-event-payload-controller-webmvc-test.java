package com.vineyards.deerPlanner.events.inbound;

import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.events.facade.EventFacade;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingAccommodationPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDressCodePayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingGiftRegistryPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingLandingPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingParentsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingStoryPayloadDto;
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
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EventPayloadController.class)
@AutoConfigureMockMvc
class Ctrl005EventPayloadControllerSliceTest {

    private static final String ORGANIZER_ID = "user-organizer-1";

    @Autowired MockMvc mvc;

    @MockitoBean EventFacade eventApi;
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

    /** A minimal valid EventDto — every test reuses this as the expected response. */
    private EventDto minimalDto() {
        return new EventDto(
            "evt-1",
            ORGANIZER_ID,
            EventType.wedding,
            "Maya & Luis",
            LocalDate.of(2027, 4, 15),
            EventStatus.draft,
            null, null, null, null,
            OffsetDateTime.parse("2026-08-01T09:00:00Z"),
            OffsetDateTime.parse("2026-08-01T09:00:00Z")
        );
    }

    @Test
    void putLocations_returns200_andPassesPayloadToEventFacade() throws Exception {
        when(eventApi.updateLocations(eq("evt-1"), any(LocationsPayloadDto.class), eq(ORGANIZER_ID)))
            .thenReturn(minimalDto());

        mvc.perform(put("/api/v1/events/{id}/locations", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "entries": [
                        {"label": "Ceremony", "name": "Parroquia", "time": "16:00"}
                      ]
                    }
                    """))
            .andExpect(status().isOk());

        verify(eventApi).updateLocations(eq("evt-1"), any(LocationsPayloadDto.class), eq(ORGANIZER_ID));
    }

    @Test
    void putLocations_returns400_whenEntriesAreEmpty() throws Exception {
        mvc.perform(put("/api/v1/events/{id}/locations", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"entries": []}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void putProgram_returns200() throws Exception {
        when(eventApi.updateProgram(eq("evt-1"), any(ProgramPayloadDto.class), eq(ORGANIZER_ID)))
            .thenReturn(minimalDto());

        mvc.perform(put("/api/v1/events/{id}/program", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "days": [
                        {
                          "date": "2027-04-15",
                          "label": "Saturday",
                          "items": [{"time": "16:00", "title": "Ceremony"}]
                        }
                      ]
                    }
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void putContacts_returns200() throws Exception {
        when(eventApi.updateContacts(eq("evt-1"), any(ContactsPayloadDto.class), eq(ORGANIZER_ID)))
            .thenReturn(minimalDto());

        mvc.perform(put("/api/v1/events/{id}/contacts", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "entries": [
                        {
                          "label": "Wedding Planner",
                          "fullName": "Ana Rodriguez",
                          "phone": "+52 55 1234 5678",
                          "email": "ana@example.com"
                        }
                      ]
                    }
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void putWeddingLanding_returns200() throws Exception {
        when(eventApi.updateWeddingLanding(eq("evt-1"), any(WeddingLandingPayloadDto.class), eq(ORGANIZER_ID)))
            .thenReturn(minimalDto());

        mvc.perform(put("/api/v1/events/{id}/wedding-landing", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"preTitle": "You are cordially invited"}
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void putWeddingStory_returns400_whenBodyBlank() throws Exception {
        mvc.perform(put("/api/v1/events/{id}/wedding-story", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"body": ""}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void putWeddingStory_returns200_whenBodyPresent() throws Exception {
        when(eventApi.updateWeddingStory(eq("evt-1"), any(WeddingStoryPayloadDto.class), eq(ORGANIZER_ID)))
            .thenReturn(minimalDto());

        mvc.perform(put("/api/v1/events/{id}/wedding-story", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"body": "We met in college eight years ago..."}
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void putWeddingDressCode_returns400_whenEntriesEmpty() throws Exception {
        mvc.perform(put("/api/v1/events/{id}/wedding-dress-code", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"entries": []}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void putWeddingGiftRegistry_returns200() throws Exception {
        when(eventApi.updateWeddingGiftRegistry(eq("evt-1"), any(WeddingGiftRegistryPayloadDto.class), eq(ORGANIZER_ID)))
            .thenReturn(minimalDto());

        mvc.perform(put("/api/v1/events/{id}/wedding-gift-registry", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
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
    void putWeddingParents_returns200() throws Exception {
        when(eventApi.updateWeddingParents(eq("evt-1"), any(WeddingParentsPayloadDto.class), eq(ORGANIZER_ID)))
            .thenReturn(minimalDto());

        mvc.perform(put("/api/v1/events/{id}/wedding-parents", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "partner1Label": "Padres de la Novia",
                      "partner1Names": ["Roberto Garcia", "Maria Lopez"]
                    }
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void putWeddingAccommodation_returns200() throws Exception {
        when(eventApi.updateWeddingAccommodation(eq("evt-1"), any(WeddingAccommodationPayloadDto.class), eq(ORGANIZER_ID)))
            .thenReturn(minimalDto());

        mvc.perform(put("/api/v1/events/{id}/wedding-accommodation", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "entries": [
                        {"name": "Hotel Boutique Casa Blanca", "priceHint": "$1,800 MXN/noche"}
                      ]
                    }
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void putAnyWedding_returns400_whenBodyIsMalformedJson() throws Exception {
        mvc.perform(put("/api/v1/events/{id}/wedding-accommodation", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{not-json}"))
            .andExpect(status().isBadRequest());
    }
}
