package com.vineyards.deerPlanner.events.inbound;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
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

import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import com.vineyards.deerPlanner.events.facade.EventInPort;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.CreateEventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventDto;
import com.vineyards.deerPlanner.events.facade.dto.EventSummaryDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.PagedEventsResponse;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.UpdateEventDto;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticatorInPort;
import com.vineyards.deerPlanner.shared.security.TokenBucketRateLimiter;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.time.Instant;
import java.time.LocalDate;
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

@WebMvcTest(EventController.class)
@AutoConfigureMockMvc
class EventControllerTest {

  private static final String ORGANIZER_ID = "user-organizer-1";

  @Autowired MockMvc mvc;

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

  private EventDto sampleDto(String id, EventStatus status) {
    return new EventDto(
        id,
        ORGANIZER_ID,
        EventType.wedding,
        "Maya & Luis",
        LocalDate.of(2027, 4, 15),
        status,
        null,
        null,
        null,
        Instant.parse("2026-08-01T09:00:00Z"),
        Instant.parse("2026-08-01T09:00:00Z"));
  }

  @Test
  void postEvents_withValidPayload_returns201WithLocationHeaderAndBody() throws Exception {
    when(eventApi.createEvent(any(CreateEventDto.class), eq(ORGANIZER_ID)))
        .thenReturn(sampleDto("evt-created", EventStatus.draft));

    mvc.perform(
            post("/api/v1/events")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "Maya & Luis",
                      "eventType": "wedding",
                      "eventDate": "2027-04-15"
                    }
                    """))
        .andExpect(status().isCreated())
        .andExpect(header().exists("Location"))
        .andExpect(jsonPath("$.id").value("evt-created"))
        .andExpect(jsonPath("$.title").value("Maya & Luis"))
        .andExpect(jsonPath("$.status").value("draft"));
  }

  @Test
  void getEventById_whenEventExists_returns200WithEventDto() throws Exception {
    when(eventApi.getEvent(eq("evt-1"))).thenReturn(sampleDto("evt-1", EventStatus.draft));

    mvc.perform(get("/api/v1/events/{id}", "evt-1").with(authorizedUser()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("evt-1"))
        .andExpect(jsonPath("$.eventType").value("wedding"));
  }

  @Test
  void getEventById_whenEventMissing_returns404ProblemDetail() throws Exception {
    when(eventApi.getEvent(eq("missing")))
        .thenThrow(new ResourceNotFoundError("event_not_found", "Event missing not found"));

    mvc.perform(get("/api/v1/events/{id}", "missing").with(authorizedUser()))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("event_not_found"));
  }

  @Test
  void listMyEvents_whenEventsExist_returns200WithItemsArrayRooted() throws Exception {
    var items =
        List.of(
            new EventSummaryDto(
                "evt-1",
                ORGANIZER_ID,
                EventType.wedding,
                "Maya & Luis",
                LocalDate.of(2027, 4, 15),
                EventStatus.draft,
                Instant.parse("2026-08-01T09:00:00Z")),
            new EventSummaryDto(
                "evt-2",
                ORGANIZER_ID,
                EventType.wedding,
                "Sofia & Diego",
                LocalDate.of(2027, 6, 20),
                EventStatus.published,
                Instant.parse("2026-08-01T10:00:00Z")));
    when(eventApi.listOwnEvents(
            org.mockito.ArgumentMatchers.eq(ORGANIZER_ID),
            org.mockito.ArgumentMatchers.eq(false),
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.isNull(),
            any(org.springframework.data.domain.Pageable.class)))
        .thenReturn(
            new PagedEventsResponse(new PagedResponse<>(items, 0, 20, items.size(), 1, false)));

    mvc.perform(get("/api/v1/events").with(authorizedUser()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.page.items").isArray())
        .andExpect(jsonPath("$.page.items.length()").value(2))
        .andExpect(jsonPath("$.page.items[0].id").value("evt-1"))
        .andExpect(jsonPath("$.page.total").value(2))
        .andExpect(jsonPath("$.page.hasMore").value(false));
  }

  @Test
  void patchEventById_withPartialDto_returns200WithUpdatedTitle() throws Exception {
    when(eventApi.updateEventMetadata(eq("evt-1"), any(UpdateEventDto.class)))
        .thenReturn(sampleDto("evt-1", EventStatus.draft));

    mvc.perform(
            patch("/api/v1/events/{id}", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"title": "Maya & Luis — Postponed"}
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("evt-1"));
  }

  @Test
  void deleteEventById_whenEventExists_returns204NoBody() throws Exception {
    mvc.perform(delete("/api/v1/events/{id}", "evt-1").with(authorizedUser()))
        .andExpect(status().isNoContent());

    org.mockito.Mockito.verify(eventApi).deleteEvent(eq("evt-1"));
  }

  @Test
  void archiveEventById_whenEventIsPublished_returns200WithArchivedStatus() throws Exception {
    when(eventApi.archiveEvent(eq("evt-1"))).thenReturn(sampleDto("evt-1", EventStatus.archived));

    mvc.perform(post("/api/v1/events/{id}/archive", "evt-1").with(authorizedUser()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("archived"));
  }

  @Test
  void postEvents_whenBodyMissingRequiredField_returns400() throws Exception {
    // title is @NotBlank, eventType is @NotNull, eventDate is @NotNull @Future.
    // Stripping title should surface 400 from MethodArgumentNotValidException.
    mvc.perform(
            post("/api/v1/events")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "eventType": "wedding",
                      "eventDate": "2027-04-15"
                    }
                    """))
        .andExpect(status().isBadRequest());
  }

  // ----- Generic JSONB payloads (migrated from EventPayloadControllerTest) -----

  @Test
  void putLocations_withValidPayload_returns200() throws Exception {
    when(eventApi.updateLocations(eq("evt-1"), any(LocationsPayloadDto.class)))
        .thenReturn(sampleDto("evt-1", EventStatus.draft));

    mvc.perform(
            put("/api/v1/events/{id}/locations", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "entries": [
                        {"label": "Ceremony", "name": "Parroquia", "time": "16:00"}
                      ]
                    }
                    """))
        .andExpect(status().isOk());

    org.mockito.Mockito.verify(eventApi)
        .updateLocations(eq("evt-1"), any(LocationsPayloadDto.class));
  }

  @Test
  void putLocations_whenEntriesAreEmpty_returns400() throws Exception {
    mvc.perform(
            put("/api/v1/events/{id}/locations", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"entries": []}
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void putProgram_withValidPayload_returns200() throws Exception {
    when(eventApi.updateProgram(eq("evt-1"), any(ProgramPayloadDto.class)))
        .thenReturn(sampleDto("evt-1", EventStatus.draft));

    mvc.perform(
            put("/api/v1/events/{id}/program", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
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
  void putContacts_withValidPayload_returns200() throws Exception {
    when(eventApi.updateContacts(eq("evt-1"), any(ContactsPayloadDto.class)))
        .thenReturn(sampleDto("evt-1", EventStatus.draft));

    mvc.perform(
            put("/api/v1/events/{id}/contacts", "evt-1")
                .with(authorizedUser())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
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
}
