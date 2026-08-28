package com.vineyards.deerPlanner.guests.inbound;

import com.vineyards.deerPlanner.events.facade.EventApi;
import com.vineyards.deerPlanner.guests.domain.GuestNotFoundException;
import com.vineyards.deerPlanner.guests.facade.GuestApi;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestDto;
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

import java.time.OffsetDateTime;
import java.util.List;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GuestsController.class)
@AutoConfigureMockMvc
class Ctrl008GuestsControllerSliceTest {

    private static final String ORGANIZER_ID = "user-organizer-1";
    private static final String EVENT_ID = "evt-1";
    private static final String GROUP_ID = "grp-1";
    private static final String GUEST_ID = "gst-1";

    @Autowired MockMvc mvc;

    @MockitoBean GuestApi guestApi;
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

    private GuestDto sampleGuest() {
        return new GuestDto(
            GUEST_ID, GROUP_ID, "Maria", "Morales",
            "maria@example.com", "+521111111111", null,
            true, "token-guest", "pending",
            null, null, null,
            OffsetDateTime.parse("2026-08-01T10:00:00Z"),
            OffsetDateTime.parse("2026-08-01T10:00:00Z")
        );
    }

    @Test
    void listGuests_returns200_andRootedItems() throws Exception {
        when(guestApi.listGuests(EVENT_ID, ORGANIZER_ID))
            .thenReturn(new ListGuestsResponse(List.of(sampleGuest()), 1));

        mvc.perform(get("/api/v1/events/{id}/guests", EVENT_ID)
                .with(authorizedUser()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.items[0].id").value(GUEST_ID))
            .andExpect(jsonPath("$.items[0].firstName").value("Maria"))
            .andExpect(jsonPath("$.items[0].rsvpStatus").value("pending"))
            .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void getGuest_returns404_whenGuestMissing() throws Exception {
        when(guestApi.getGuest(eq("missing"), eq(ORGANIZER_ID)))
            .thenThrow(new GuestNotFoundException("missing"));

        mvc.perform(get("/api/v1/events/{eid}/guests/{gid}", EVENT_ID, "missing")
                .with(authorizedUser()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("guest_not_found"));
    }

    @Test
    void postGuest_returns201WithLocation() throws Exception {
        when(guestApi.createGuest(eq(EVENT_ID), any(CreateGuestDto.class), eq(ORGANIZER_ID)))
            .thenReturn(sampleGuest());

        String body = """
            {
              "groupId": "grp-1",
              "firstName": "Maria",
              "lastName": "Morales",
              "email": "maria@example.com",
              "phone": "+521111111111",
              "primary": true
            }
            """;

        mvc.perform(post("/api/v1/events/{id}/guests", EVENT_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(GUEST_ID))
            .andExpect(jsonPath("$.groupId").value(GROUP_ID));
    }

    @Test
    void postGuest_returns400_whenFirstNameBlank() throws Exception {
        mvc.perform(post("/api/v1/events/{id}/guests", EVENT_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"groupId": "grp-1", "lastName": "Morales"}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void postGuest_returns400_whenGroupIdMissing() throws Exception {
        // groupId is @NotBlank — required so the service can place the guest in the right group.
        mvc.perform(post("/api/v1/events/{id}/guests", EVENT_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"firstName": "Maria", "lastName": "Morales"}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void patchGuest_returns200_withUpdatedName() throws Exception {
        GuestDto updated = new GuestDto(
            GUEST_ID, GROUP_ID, "María José", "Morales",
            null, null, null, false, "token-guest", "pending",
            null, null, null,
            OffsetDateTime.parse("2026-08-01T10:00:00Z"),
            OffsetDateTime.parse("2026-08-02T10:00:00Z")
        );
        when(guestApi.updateGuest(eq(GUEST_ID), any(UpdateGuestDto.class), eq(ORGANIZER_ID)))
            .thenReturn(updated);

        mvc.perform(patch("/api/v1/events/{eid}/guests/{gid}", EVENT_ID, GUEST_ID)
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"firstName": "María José"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.firstName").value("María José"));
    }

    @Test
    void deleteGuest_returns204() throws Exception {
        mvc.perform(delete("/api/v1/events/{eid}/guests/{gid}", EVENT_ID, GUEST_ID)
                .with(authorizedUser()))
            .andExpect(status().isNoContent());

        verify(guestApi).deleteGuest(eq(GUEST_ID), eq(ORGANIZER_ID));
    }
}
