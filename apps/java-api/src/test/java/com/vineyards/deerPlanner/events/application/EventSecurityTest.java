package com.vineyards.deerPlanner.events.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.vineyards.deerPlanner.events.application.port.EventOutPort;
import com.vineyards.deerPlanner.events.domain.Event;
import com.vineyards.deerPlanner.events.domain.EventStatus;
import com.vineyards.deerPlanner.events.domain.EventType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EventSecurityTest {

  @Mock EventOutPort eventRepository;

  private EventSecurity security;

  @BeforeEach
  void setUp() {
    security = new EventSecurity(eventRepository);
  }

  @Test
  void isOwner_whenUsernameMatchesOrganizerId_returnsTrue() {
    Event event = sampleEvent("evt-1", "owner-1");
    when(eventRepository.findById("evt-1")).thenReturn(Optional.of(event));

    assertThat(security.isOwner("evt-1", "owner-1")).isTrue();
  }

  @Test
  void isOwner_whenUsernameDoesNotMatchOrganizerId_returnsFalse() {
    Event event = sampleEvent("evt-1", "owner-1");
    when(eventRepository.findById("evt-1")).thenReturn(Optional.of(event));

    assertThat(security.isOwner("evt-1", "intruder")).isFalse();
  }

  @Test
  void isOwner_whenEventDoesNotExist_returnsTrueSoServiceCanReturn404() {
    when(eventRepository.findById("missing")).thenReturn(Optional.empty());

    // Returning true keeps the security check from blocking a missing-event lookup;
    // the service answers with 404, matching the standard not-found behaviour.
    assertThat(security.isOwner("missing", "anyone")).isTrue();
  }

  @Test
  void isOwner_whenArgumentsAreNull_returnsFalse() {
    assertThat(security.isOwner(null, "user")).isFalse();
    assertThat(security.isOwner("evt-1", null)).isFalse();
  }

  private static Event sampleEvent(String id, String organizerId) {
    return new Event(
        id,
        organizerId,
        EventType.wedding,
        "Sample",
        LocalDate.of(2027, 6, 1),
        EventStatus.draft,
        null,
        null,
        null,
        Instant.parse("2026-08-01T09:00:00Z"),
        Instant.parse("2026-08-01T09:00:00Z"));
  }
}
