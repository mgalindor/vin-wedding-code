package com.vineyards.deerPlanner.guests.outbound;

import com.vineyards.deerPlanner.guests.application.port.GuestGroupRepository;
import com.vineyards.deerPlanner.guests.domain.GuestGroup;
import com.vineyards.deerPlanner.guests.domain.GuestRelationship;
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
        return jpa.findByEventIdOrderByDisplayOrderAscNameAsc(eventId)
            .stream().map(GuestGroupRepositoryAdapter::toDomain).toList();
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
        return new GuestGroup(
            e.getId(), e.getEventId(), e.getName(),
            java.util.Optional.ofNullable(e.getSide()),
            GuestRelationship.fromString(e.getRelationship()),
            java.util.Optional.ofNullable(e.getSharedEmail()),
            java.util.Optional.ofNullable(e.getSharedPhone()),
            java.util.Optional.ofNullable(e.getPrimaryGuestId()),
            e.getInvitationToken(), e.getDisplayOrder(),
            e.getCreatedAt(), e.getUpdatedAt()
        );
    }

    static GuestGroupEntity toEntity(GuestGroup d) {
        GuestGroupEntity e = new GuestGroupEntity();
        e.setId(d.id());
        e.setEventId(d.eventId());
        e.setName(d.name());
        e.setSide(d.side().orElse(null));
        e.setRelationship(d.relationship().name());
        e.setSharedEmail(d.sharedEmail().orElse(null));
        e.setSharedPhone(d.sharedPhone().orElse(null));
        e.setPrimaryGuestId(d.primaryGuestId().orElse(null));
        e.setInvitationToken(d.invitationToken());
        e.setDisplayOrder(d.displayOrder());
        e.setCreatedAt(d.createdAt());
        e.setUpdatedAt(d.updatedAt());
        return e;
    }
}
