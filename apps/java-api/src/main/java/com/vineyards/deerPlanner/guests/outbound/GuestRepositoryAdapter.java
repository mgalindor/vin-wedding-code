package com.vineyards.deerPlanner.guests.outbound;

import com.vineyards.deerPlanner.guests.application.port.GuestRepository;
import com.vineyards.deerPlanner.guests.domain.Guest;
import com.vineyards.deerPlanner.guests.domain.RsvpStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

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
        return jpa.findByGroupIdOrderByLastNameAscFirstNameAsc(groupId)
            .stream().map(GuestRepositoryAdapter::toDomain).toList();
    }

    @Override
    public List<Guest> findByEventIdGroupIds(List<String> groupIds) {
        if (groupIds.isEmpty()) {
            return List.of();
        }
        return jpa.findByGroupIdInOrderByLastNameAscFirstNameAsc(groupIds)
            .stream().map(GuestRepositoryAdapter::toDomain).toList();
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
        return new Guest(
            e.getId(), e.getGroupId(), e.getFirstName(), e.getLastName(),
            java.util.Optional.ofNullable(e.getEmail()),
            java.util.Optional.ofNullable(e.getPhone()),
            java.util.Optional.ofNullable(e.getDietaryNotes()),
            e.isPrimary(),
            e.getInvitationToken(),
            RsvpStatus.fromString(e.getRsvpStatus()),
            java.util.Optional.ofNullable(e.getRsvpConfirmedAt()),
            java.util.Optional.ofNullable(e.getRsvpMessage()),
            java.util.Optional.ofNullable(e.getRsvpDietaryChoice()),
            e.getCreatedAt(), e.getUpdatedAt()
        );
    }

    static GuestEntity toEntity(Guest d) {
        GuestEntity e = new GuestEntity();
        e.setId(d.id());
        e.setGroupId(d.groupId());
        e.setFirstName(d.firstName());
        e.setLastName(d.lastName());
        e.setEmail(d.email().orElse(null));
        e.setPhone(d.phone().orElse(null));
        e.setDietaryNotes(d.dietaryNotes().orElse(null));
        e.setPrimary(d.primary());
        e.setInvitationToken(d.invitationToken());
        e.setRsvpStatus(d.rsvpStatus().name());
        e.setRsvpConfirmedAt(d.rsvpConfirmedAt().orElse(null));
        e.setRsvpMessage(d.rsvpMessage().orElse(null));
        e.setRsvpDietaryChoice(d.rsvpDietaryChoice().orElse(null));
        e.setCreatedAt(d.createdAt());
        e.setUpdatedAt(d.updatedAt());
        return e;
    }
}
