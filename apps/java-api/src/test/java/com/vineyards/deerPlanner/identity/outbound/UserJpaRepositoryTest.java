package com.vineyards.deerPlanner.identity.outbound;

import static org.assertj.core.api.Assertions.assertThat;

import com.vineyards.deerPlanner.shared.config.JpaConfig;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.jdbc.Sql;

@DataJpaTest(
    properties = {
      // The production Liquibase changelog uses PostgreSQL-specific PL/pgSQL
      // (CREATE OR REPLACE FUNCTION ... LANGUAGE plpgsql) which H2 cannot parse.
      // For the slice tests we let Hibernate build the schema from the JPA mappings.
      "spring.liquibase.enabled=false",
      "spring.jpa.hibernate.ddl-auto=create-drop"
    })
@AutoConfigureTestDatabase
@Import(JpaConfig.class)
class UserJpaRepositoryTest {

  @Autowired UserJpaRepository repository;

  @Test
  @Sql(
      scripts = "/sql/identity/user-repository/find-by-username-case-insensitive.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void findByUsername_whenCaseDiffers_findsUserRegardlessOfCase() {
    var foundUpper = repository.findByUsername("ALICE");
    var foundLower = repository.findByUsername("alice");
    var foundMixed = repository.findByUsername("AlIcE");

    assertThat(foundUpper).isPresent();
    assertThat(foundLower).isPresent();
    assertThat(foundMixed).isPresent();
    assertThat(foundLower.get().getUsername()).isEqualTo("alice");
    assertThat(foundLower.get().getId()).isEqualTo("u-alice-1");
    assertThat(foundLower.get().isActive()).isTrue();
  }

  @Test
  @Sql(
      scripts = "/sql/identity/user-repository/find-by-username-not-found.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void findByUsername_whenNoMatch_returnsEmpty() {
    assertThat(repository.findByUsername("nobody")).isEmpty();
  }

  @Test
  @Sql(
      scripts = "/sql/identity/user-repository/find-active-by-id-returns-user.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void findActiveById_whenUserIsActive_returnsUser() {
    var found = repository.findActiveById("u-alice-active");

    assertThat(found).isPresent();
    assertThat(found.get().getDisplayName()).isEqualTo("Alice Doe");
    assertThat(found.get().isActive()).isTrue();
  }

  @Test
  @Sql(
      scripts = "/sql/identity/user-repository/find-active-by-id-skips-inactive.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void findActiveById_whenUserIsInactive_filtersOut() {
    assertThat(repository.findActiveById("u-bob-inactive")).isEmpty();
  }

  @Test
  @Sql(
      scripts = "/sql/identity/user-repository/record-login-stamps-last-login-at.sql",
      executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  void recordLogin_whenCalled_stampsLastLoginAt() {
    Instant stampedAt = Instant.parse("2026-08-27T12:00:00Z");
    repository.recordLogin("u-alice-login", stampedAt);

    var reloaded = repository.findByUsername("alice").orElseThrow();
    assertThat(reloaded.getLastLoginAt()).isNotNull();
    assertThat(reloaded.getLastLoginAt()).isEqualTo(stampedAt);
  }
}
