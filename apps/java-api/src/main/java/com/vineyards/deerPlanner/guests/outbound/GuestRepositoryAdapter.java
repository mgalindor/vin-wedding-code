package com.vineyards.deerPlanner.guests.outbound;

import com.vineyards.deerPlanner.guests.application.port.GuestRepository;
import com.vineyards.deerPlanner.guests.domain.Guest;
import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
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
public class GuestRepositoryAdapter implements GuestRepository {

  private final GuestJpaRepository jpa;

  @Override
  public Guest save(Guest guest) {
    return toDomain(jpa.save(toEntity(guest)));
  }

  @Override
  public Optional<Guest> findById(String id) {
    return jpa.findById(id).map(GuestRepositoryAdapter::toDomain);
  }

  @Override
  public List<Guest> findByGroupId(String groupId) {
    return jpa.findByGroupIdOrderByLastNameAscFirstNameAsc(groupId).stream()
        .map(GuestRepositoryAdapter::toDomain)
        .toList();
  }

  @Override
  public List<Guest> findByEventIdGroupIds(List<String> groupIds) {
    if (groupIds.isEmpty()) {
      return List.of();
    }
    return jpa.findByGroupIdInOrderByLastNameAscFirstNameAsc(groupIds).stream()
        .map(GuestRepositoryAdapter::toDomain)
        .toList();
  }

  @Override
  public void deleteById(String id) {
    jpa.deleteById(id);
  }

  @Override
  public long countByGroupId(String groupId) {
    return jpa.countByGroupId(groupId);
  }

  static Guest toDomain(GuestEntity e) {
    return Guest.builder()
        .id(e.getId())
        .groupId(e.getGroupId())
        .firstName(e.getFirstName())
        .lastName(e.getLastName())
        .email(java.util.Optional.ofNullable(e.getEmail()))
        .phone(java.util.Optional.ofNullable(e.getPhone()))
        .dietaryNotes(java.util.Optional.ofNullable(e.getDietaryNotes()))
        .primary(e.isPrimary())
        .invitationToken(e.getInvitationToken())
        .rsvpStatus(RsvpStatus.fromString(e.getRsvpStatus()))
        .rsvpConfirmedAt(java.util.Optional.ofNullable(e.getRsvpConfirmedAt()))
        .rsvpMessage(java.util.Optional.ofNullable(e.getRsvpMessage()))
        .rsvpDietaryChoice(java.util.Optional.ofNullable(e.getRsvpDietaryChoice()))
        .createdAt(e.getCreatedAt())
        .updatedAt(e.getUpdatedAt())
        .build();
  }

  static GuestEntity toEntity(Guest d) {
    GuestEntity e = new GuestEntity();
    e.setId(d.getId());
    e.setGroupId(d.getGroupId());
    e.setFirstName(d.getFirstName());
    e.setLastName(d.getLastName());
    e.setEmail(d.getEmail().orElse(null));
    e.setPhone(d.getPhone().orElse(null));
    e.setDietaryNotes(d.getDietaryNotes().orElse(null));
    e.setPrimary(d.isPrimary());
    e.setInvitationToken(d.getInvitationToken());
    e.setRsvpStatus(d.getRsvpStatus().name());
    e.setRsvpConfirmedAt(d.getRsvpConfirmedAt().orElse(null));
    e.setRsvpMessage(d.getRsvpMessage().orElse(null));
    e.setRsvpDietaryChoice(d.getRsvpDietaryChoice().orElse(null));
    e.setCreatedAt(d.getCreatedAt());
    e.setUpdatedAt(d.getUpdatedAt());
    return e;
  }
}
