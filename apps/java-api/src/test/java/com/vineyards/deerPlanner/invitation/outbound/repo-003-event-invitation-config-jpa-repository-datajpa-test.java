package com.vineyards.deerPlanner.invitation.outbound;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.jdbc.Sql;

@DataJpaTest(
    properties = {"spring.liquibase.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"})
@AutoConfigureTestDatabase
class Repo003EventInvitationConfigJpaRepositorySliceTest {

  @Autowired EventInvitationConfigJpaRepository repository;

  @Test
  @Sql(
      scripts = "/sql/invitation/event-invitation-config/find-by-slug.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void findBySlug_returnsConfig_whenSlugExists() {
    Optional<EventInvitationConfigEntity> config = repository.findBySlug("emma-james-2026");

    assertThat(config).isPresent();
    assertThat(config.get().getEventId()).isEqualTo("evt-1");
    assertThat(config.get().isActive()).isTrue();
  }

  @Test
  @Sql(
      scripts = "/sql/invitation/event-invitation-config/find-by-slug-not-found.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void findBySlug_returnsEmpty_whenSlugMissing() {
    assertThat(repository.findBySlug("nope")).isEmpty();
  }

  @Test
  @Sql(
      scripts = "/sql/invitation/event-invitation-config/find-by-event-id.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void findById_returnsConfig_whenEventIdExists() {
    Optional<EventInvitationConfigEntity> config = repository.findById("evt-1");

    assertThat(config).isPresent();
    assertThat(config.get().getSlug()).isEqualTo("emma-james-2026");
  }

  @Test
  @Sql(
      scripts = "/sql/invitation/event-invitation-config/save-new-config.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void save_persistsConfig_andGeneratesUpdatedAt() {
    EventInvitationConfigEntity entity = new EventInvitationConfigEntity();
    entity.setEventId("evt-new");
    entity.setTemplateId("tpl-wedding-romantic-v1");
    entity.setActive(true);
    entity.setRsvpEnabled(true);
    entity.setSlug("new-event-2027");
    entity.setPublishedAt(OffsetDateTime.parse("2026-09-01T10:00:00Z"));
    entity.setDeadline(LocalDate.of(2027, 9, 1));
    entity.setUpdatedAt(OffsetDateTime.now());

    EventInvitationConfigEntity saved = repository.save(entity);

    assertThat(saved.getEventId()).isEqualTo("evt-new");
    assertThat(saved.getSlug()).isEqualTo("new-event-2027");
    assertThat(saved.isActive()).isTrue();
  }

  @Test
  @Sql(
      scripts = "/sql/invitation/event-invitation-config/exists-by-slug.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void existsBySlug_returnsTrue_whenSlugTaken() {
    assertThat(repository.existsBySlug("emma-james-2026")).isTrue();
  }

  @Test
  @Sql(
      scripts = "/sql/invitation/event-invitation-config/not-exists-by-slug.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void existsBySlug_returnsFalse_whenSlugAvailable() {
    assertThat(repository.existsBySlug("available-slug")).isFalse();
  }
}
