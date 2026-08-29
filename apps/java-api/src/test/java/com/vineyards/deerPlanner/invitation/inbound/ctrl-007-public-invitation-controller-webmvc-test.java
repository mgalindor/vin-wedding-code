package com.vineyards.deerPlanner.invitation.inbound;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vineyards.deerPlanner.events.facade.EventFacade;
import com.vineyards.deerPlanner.invitation.facade.PublicInvitationFacade;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicInvitationDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpRequestDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpResponseDto;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PublicInvitationController.class)
@AutoConfigureMockMvc(addFilters = false)
class Ctrl007PublicInvitationControllerSliceTest {

  private static final String SLUG = "emma-james-2026";

  @Autowired MockMvc mvc;

  @MockitoBean PublicInvitationFacade publicInvitationApi;
  // Required by the web slice so the controller's declared dependencies resolve.
  @MockitoBean EventFacade eventApi;
  // Neutralise the shared security beans so the context can load without the full
  // JWT stack. PublicInvitationController is permitAll() in production; the slice
  // mirrors that by skipping the filter chain.
  @MockitoBean JwtAuthenticator jwtAuthenticator;
  @MockitoBean JwtAuthenticationFilter jwtAuthenticationFilter;
  @MockitoBean JwtDecoder jwtDecoder;

  @Test
  void getPublicInvitation_returns200_whenFound() throws Exception {
    when(publicInvitationApi.getBySlug(SLUG))
        .thenReturn(new PublicInvitationDto(SLUG, true, true, null, null));

    mvc.perform(get("/api/v1/public/invitations/{slug}", SLUG))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.slug").value(SLUG))
        .andExpect(jsonPath("$.active").value(true))
        .andExpect(jsonPath("$.rsvpEnabled").value(true));
  }

  @Test
  void getPublicInvitation_returns404_whenSlugUnknown() throws Exception {
    when(publicInvitationApi.getBySlug(eq("missing-slug")))
        .thenThrow(
            new ResourceNotFoundError("invitation_not_found", "Invitation missing-slug not found"));

    mvc.perform(get("/api/v1/public/invitations/{slug}", "missing-slug"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("invitation_not_found"));
  }

  @Test
  void postRsvp_returns200_andPassesPayloadToApi() throws Exception {
    when(publicInvitationApi.submitRsvp(eq(SLUG), any(PublicRsvpRequestDto.class)))
        .thenReturn(new PublicRsvpResponseDto("confirmed_full", "Gracias por confirmar"));

    mvc.perform(
            post("/api/v1/public/invitations/{slug}/rsvp", SLUG)
                .contentType("application/json")
                .content(
                    """
                    {
                      "response": "confirmed_full",
                      "message": "We will be there"
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("confirmed_full"));
  }

  @Test
  void postRsvp_returns400_whenResponseIsMissing() throws Exception {
    mvc.perform(
            post("/api/v1/public/invitations/{slug}/rsvp", SLUG)
                .contentType("application/json")
                .content(
                    """
                    {"message": "no response field"}
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void getPublicInvitation_returnsJsonRootedObject_notBareArray() throws Exception {
    // Sanity: the response must be a JSON object (root), not an array. The shape
    // is enforced by PublicInvitationDto being a record, so any leakage would have
    // failed compile-time.
    when(publicInvitationApi.getBySlug(SLUG))
        .thenReturn(new PublicInvitationDto(SLUG, true, true, null, null));

    String body =
        mvc.perform(get("/api/v1/public/invitations/{slug}", SLUG))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    assertThat(body.trim().startsWith("{")).isTrue();
    assertThat(body.trim().endsWith("}")).isTrue();
  }
}
