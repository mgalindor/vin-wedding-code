package com.vineyards.deerPlanner.guests.outbound;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.jdbc.Sql;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
    "spring.liquibase.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureTestDatabase
class Repo004GuestGroupJpaRepositorySliceTest {

    @Autowired GuestGroupJpaRepository repository;

    @Test
    @Sql(
        scripts = "/sql/guests/guest-group-repository/find-by-event-id.sql",
        executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD
    )
    void findByEventId_returnsGroupsOrderedByDisplayOrder() {
        List<GuestGroupEntity> groups = repository.findByEventIdOrderByDisplayOrderAscNameAsc("evt-1");

        assertThat(groups).hasSize(3);
        // displayOrder asc, then name asc
        assertThat(groups.get(0).getDisplayOrder()).isEqualTo(0);
        assertThat(groups.get(0).getName()).isEqualTo("Amigos");
        assertThat(groups.get(1).getDisplayOrder()).isEqualTo(1);
        assertThat(groups.get(1).getName()).isEqualTo("Familia");
        assertThat(groups.get(2).getDisplayOrder()).isEqualTo(2);
        assertThat(groups.get(2).getName()).isEqualTo("Trabajo");
    }

    @Test
    @Sql(
        scripts = "/sql/guests/guest-group-repository/find-by-event-id-empty.sql",
        executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD
    )
    void findByEventId_returnsEmpty_whenNoGroups() {
        assertThat(repository.findByEventIdOrderByDisplayOrderAscNameAsc("evt-empty")).isEmpty();
    }

    @Test
    @Sql(
        scripts = "/sql/guests/guest-group-repository/find-by-id.sql",
        executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD
    )
    void findById_returnsGroup_whenPresent() {
        Optional<GuestGroupEntity> group = repository.findById("grp-1");

        assertThat(group).isPresent();
        assertThat(group.get().getName()).isEqualTo("Familia");
        assertThat(group.get().getRelationship()).isEqualTo("family");
    }

    @Test
    @Sql(
        scripts = "/sql/guests/guest-group-repository/exists-by-token.sql",
        executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD
    )
    void existsByInvitationToken_returnsTrue_whenTokenInUse() {
        assertThat(repository.existsByInvitationToken("token-1")).isTrue();
    }

    @Test
    @Sql(
        scripts = "/sql/guests/guest-group-repository/not-exists-by-token.sql",
        executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD
    )
    void existsByInvitationToken_returnsFalse_whenTokenAvailable() {
        assertThat(repository.existsByInvitationToken("available-token")).isFalse();
    }

    @Test
    @Sql(
        scripts = "/sql/guests/guest-group-repository/save-new-group.sql",
        executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD
    )
    void save_persistsGroupWithGeneratedColumns() {
        GuestGroupEntity entity = new GuestGroupEntity();
        entity.setId("grp-new");
        entity.setEventId("evt-1");
        entity.setName("New Group");
        entity.setSide("Novia");
        entity.setRelationship("family");
        entity.setInvitationToken("new-token");
        entity.setDisplayOrder(0);
        java.time.OffsetDateTime now = java.time.OffsetDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        GuestGroupEntity saved = repository.save(entity);

        assertThat(saved.getId()).isEqualTo("grp-new");
        assertThat(saved.getInvitationToken()).isEqualTo("new-token");
    }
}
