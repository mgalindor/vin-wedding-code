package com.vineyards.deerPlanner.guests.outbound;

import com.vineyards.deerPlanner.guests.application.port.GuestGroupRepository;
import com.vineyards.deerPlanner.guests.domain.GuestGroup;
import com.vineyards.deerPlanner.guests.domain.GuestRelationship;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.stereotype.Component;

@Component
@SecondaryAdapter
@RequiredArgsConstructor
@Slf4j
public class GuestGroupRepositoryAdapter implements GuestGroupRepository {

  private final GuestGroupJpaRepository jpa;

  @Override
  public GuestGroup save(GuestGroup group) {
    return toDomain(jpa.save(toEntity(group)));
  }

  @Override
  public Optional<GuestGroup> findById(String id) {
    return jpa.findById(id).map(GuestGroupRepositoryAdapter::toDomain);
  }

  @Override
  public List<GuestGroup> findByEventId(String eventId) {
    return jpa.findByEventIdOrderByDisplayOrderAscNameAsc(eventId).stream()
        .map(GuestGroupRepositoryAdapter::toDomain)
        .toList();
  }

  @Override
  public void deleteById(String id) {
    jpa.deleteById(id);
  }

  @Override
  public boolean existsByInvitationToken(String token) {
    return jpa.existsByInvitationToken(token);
  }

  static GuestGroup toDomain(GuestGroupEntity e) {
    return GuestGroup.builder()
        .id(e.getId())
        .eventId(e.getEventId())
        .name(e.getName())
        .side(java.util.Optional.ofNullable(e.getSide()))
        .relationship(GuestRelationship.fromString(e.getRelationship()))
        .sharedEmail(java.util.Optional.ofNullable(e.getSharedEmail()))
        .sharedPhone(java.util.Optional.ofNullable(e.getSharedPhone()))
        .primaryGuestId(java.util.Optional.ofNullable(e.getPrimaryGuestId()))
        .invitationToken(e.getInvitationToken())
        .displayOrder(e.getDisplayOrder())
        .createdAt(e.getCreatedAt())
        .updatedAt(e.getUpdatedAt())
        .build();
  }

  static GuestGroupEntity toEntity(GuestGroup d) {
    GuestGroupEntity e = new GuestGroupEntity();
    e.setId(d.getId());
    e.setEventId(d.getEventId());
    e.setName(d.getName());
    e.setSide(d.getSide().orElse(null));
    e.setRelationship(d.getRelationship().name());
    e.setSharedEmail(d.getSharedEmail().orElse(null));
    e.setSharedPhone(d.getSharedPhone().orElse(null));
    e.setPrimaryGuestId(d.getPrimaryGuestId().orElse(null));
    e.setInvitationToken(d.getInvitationToken());
    e.setDisplayOrder(d.getDisplayOrder());
    e.setCreatedAt(d.getCreatedAt());
    e.setUpdatedAt(d.getUpdatedAt());
    return e;
  }
}
