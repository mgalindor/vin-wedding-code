package com.vineyards.deerPlanner.invitation.inbound;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.events.facade.WeddingEventInPort;
import com.vineyards.deerPlanner.guests.facade.GuestInPort;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.invitation.facade.PublicInvitationInPort;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicGroupRsvpRequestDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicGroupViewDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicInvitationDto;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticatorInPort;
import com.vineyards.deerPlanner.shared.security.TokenBucketRateLimiter;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PublicInvitationController.class)
@AutoConfigureMockMvc(addFilters = false)
class PublicInvitationControllerTest {

  private static final String SLUG = "emma-james-2026";
  private static final String GROUP_TOKEN = "token-grp-1";
  private static final String GROUP_ID = "grp-1";

  @Autowired MockMvc mvc;

  @MockitoBean PublicInvitationInPort publicInvitationApi;
  // Required by the web slice so the controller's declared dependencies resolve.
  @MockitoBean EventInPort eventApi;
  @MockitoBean WeddingEventInPort weddingEventApi;
  @MockitoBean GuestInPort guestApi;
  // Neutralise the shared security beans so the context can load without the full
  // JWT stack. PublicInvitationController is permitAll() in production; the slice
  // mirrors that by skipping the filter chain.
  @MockitoBean JwtAuthenticatorInPort jwtAuthenticator;
  @MockitoBean JwtAuthenticationFilter jwtAuthenticationFilter;
  @MockitoBean JwtDecoder jwtDecoder;
  @MockitoBean TokenBucketRateLimiter rateLimiter;

  // ============== GET /{slug} ==============

  @Test
  void getPublicInvitation_whenFound_returns200() throws Exception {
    when(publicInvitationApi.getBySlug(SLUG))
        .thenReturn(new PublicInvitationDto(SLUG, true, true, null, null, null));

    mvc.perform(get("/api/v1/public/invitations/{slug}", SLUG))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.slug").value(SLUG))
        .andExpect(jsonPath("$.active").value(true))
        .andExpect(jsonPath("$.rsvpEnabled").value(true));
  }

  @Test
  void getPublicInvitation_whenSlugUnknown_returns404() throws Exception {
    when(publicInvitationApi.getBySlug(eq("missing-slug")))
        .thenThrow(
            new ResourceNotFoundError("invitation_not_found", "Invitation missing-slug not found"));

    mvc.perform(get("/api/v1/public/invitations/{slug}", "missing-slug"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("invitation_not_found"));
  }

  // ============== GET /{slug}/groups/{groupToken} ==============

  @Test
  void getGroup_whenFound_returns200WithGroupAndGuests() throws Exception {
    GuestGroupDto group =
        new GuestGroupDto(
            GROUP_ID,
            "evt-1",
            "Familia Morales",
            "family",
            null,
            null,
            null,
            GROUP_TOKEN,
            0,
            Instant.parse("2026-08-15T10:00:00Z"),
            Instant.parse("2026-08-15T10:00:00Z"));
    GuestDto guest =
        new GuestDto(
            "gst-1",
            GROUP_ID,
            "Maria Morales",
            null,
            null,
            null,
            "token-gst-1",
            "pending",
            null,
            null,
            null,
            Instant.parse("2026-08-15T10:00:00Z"),
            Instant.parse("2026-08-15T10:00:00Z"));
    when(publicInvitationApi.getGroup(SLUG, GROUP_TOKEN))
        .thenReturn(new PublicGroupViewDto(SLUG, group, List.of(guest)));

    mvc.perform(get("/api/v1/public/invitations/{slug}/groups/{token}", SLUG, GROUP_TOKEN))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.slug").value(SLUG))
        .andExpect(jsonPath("$.group.id").value(GROUP_ID))
        .andExpect(jsonPath("$.guests[0].id").value("gst-1"));
  }

  // ============== PUT /{slug}/groups/{groupToken}/rsvp ==============

  @Test
  void putGroupRsvp_withValidPayload_returns200() throws Exception {
    GuestGroupDto group =
        new GuestGroupDto(
            GROUP_ID,
            "evt-1",
            "Familia Morales",
            "family",
            null,
            null,
            null,
            GROUP_TOKEN,
            0,
            Instant.parse("2026-08-15T10:00:00Z"),
            Instant.parse("2026-08-15T10:00:00Z"));
    GuestDto updated =
        new GuestDto(
            "gst-1",
            GROUP_ID,
            "Maria Morales",
            null,
            null,
            null,
            "token-gst-1",
            "confirmed",
            Instant.parse("2026-09-01T10:00:00Z"),
            null,
            null,
            Instant.parse("2026-08-15T10:00:00Z"),
            Instant.parse("2026-09-01T10:00:00Z"));
    when(publicInvitationApi.submitGroupRsvp(
            eq(SLUG), eq(GROUP_TOKEN), any(PublicGroupRsvpRequestDto.class)))
        .thenReturn(new PublicGroupViewDto(SLUG, group, List.of(updated)));

    mvc.perform(
            put("/api/v1/public/invitations/{slug}/groups/{token}/rsvp", SLUG, GROUP_TOKEN)
                .contentType("application/json")
                .content(
                    """
                    {
                      "message": "All confirmed",
                      "guests": [
                        {"guestId": "gst-1", "status": "confirmed"}
                      ]
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.guests[0].rsvpStatus").value("confirmed"));
  }

  @Test
  void putGroupRsvp_whenGuestsMissing_returns400() throws Exception {
    mvc.perform(
            put("/api/v1/public/invitations/{slug}/groups/{token}/rsvp", SLUG, GROUP_TOKEN)
                .contentType("application/json")
                .content(
                    """
                    {"message": "no guests array"}
                    """))
        .andExpect(status().isBadRequest());
  }
}
