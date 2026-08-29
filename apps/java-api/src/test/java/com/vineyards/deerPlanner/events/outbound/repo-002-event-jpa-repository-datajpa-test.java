package com.vineyards.deerPlanner.events.outbound;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.jdbc.Sql;

@DataJpaTest(
    properties = {
      // Production Liquibase changelogs use PostgreSQL-specific PL/pgSQL which H2 cannot
      // parse. For slice tests we let Hibernate build the schema from the JPA mappings.
      "spring.liquibase.enabled=false",
      "spring.jpa.hibernate.ddl-auto=create-drop"
    })
@AutoConfigureTestDatabase
class Repo002EventJpaRepositorySliceTest {

  @Autowired EventJpaRepository repository;

  @Test
  @Sql(
      scripts = "/sql/events/event-repository/find-by-id.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void findById_returnsEvent_whenRowExists() {
    Optional<EventEntity> event = repository.findById("evt-1");

    assertThat(event).isPresent();
    assertThat(event.get().getTitle()).isEqualTo("Maya & Luis");
    assertThat(event.get().getEventDate()).isEqualTo(LocalDate.of(2027, 4, 15));
    assertThat(event.get().getStatus()).isEqualTo("draft");
  }

  @Test
  @Sql(
      scripts = "/sql/events/event-repository/find-by-id-not-found.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void findById_returnsEmpty_whenNoMatch() {
    assertThat(repository.findById("missing")).isEmpty();
  }

  @Test
  @Sql(
      scripts = "/sql/events/event-repository/find-by-organizer-id.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void findByOrganizerId_returnsEventsOrderedByEventDateDesc() {
    List<EventEntity> events = repository.findByOrganizerIdOrderByEventDateDesc("user-organizer-1");

    assertThat(events).hasSize(2);
    assertThat(events.get(0).getId()).isEqualTo("evt-2");
    assertThat(events.get(1).getId()).isEqualTo("evt-1");
    assertThat(events.get(0).getEventDate()).isAfter(events.get(1).getEventDate());
  }

  @Test
  @Sql(
      scripts = "/sql/events/event-repository/find-by-organizer-id-isolation.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void findByOrganizerId_returnsOnlyEventsForRequestedOrganizer() {
    List<EventEntity> ownEvents =
        repository.findByOrganizerIdOrderByEventDateDesc("user-organizer-1");
    List<EventEntity> otherEvents =
        repository.findByOrganizerIdOrderByEventDateDesc("user-organizer-other");

    assertThat(ownEvents).isEmpty();
    assertThat(otherEvents).hasSize(1);
    assertThat(otherEvents.get(0).getOrganizerId()).isEqualTo("user-organizer-other");
  }

  @Test
  @Sql(
      scripts = "/sql/events/event-repository/save-new-event.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void save_persistsNewEvent_withGeneratedTimestamps() {
    EventEntity entity = new EventEntity();
    entity.setId("evt-new");
    entity.setOrganizerId("user-organizer-1");
    entity.setEventType("wedding");
    entity.setTitle("Newly created");
    entity.setEventDate(LocalDate.of(2027, 9, 1));
    entity.setStatus("draft");

    EventEntity saved = repository.save(entity);

    assertThat(saved.getId()).isEqualTo("evt-new");
    // @PrePersist populates created_at and updated_at; updated_at must be present.
    assertThat(saved.getCreatedAt()).isNotNull();
    assertThat(saved.getUpdatedAt()).isNotNull();
  }

  @Test
  @Sql(
      scripts = "/sql/events/event-repository/delete-by-id.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void deleteById_removesRow() {
    assertThat(repository.findById("evt-to-delete")).isPresent();
    repository.deleteById("evt-to-delete");
    assertThat(repository.findById("evt-to-delete")).isEmpty();
  }

  @Test
  @Sql(
      scripts = "/sql/events/event-repository/exists-by-organizer-and-date.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void existsByOrganizerAndEventDate_returnsTrue_whenDateMatches() {
    boolean exists =
        repository.existsByOrganizerIdAndEventDate("user-organizer-1", LocalDate.of(2027, 4, 15));

    assertThat(exists).isTrue();
  }

  @Test
  @Sql(
      scripts = "/sql/events/event-repository/not-exists-by-organizer-and-date.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void existsByOrganizerAndEventDate_returnsFalse_whenNoMatch() {
    boolean exists =
        repository.existsByOrganizerIdAndEventDate("user-organizer-1", LocalDate.of(2030, 1, 1));

    assertThat(exists).isFalse();
  }
}
