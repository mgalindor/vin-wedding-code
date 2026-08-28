package com.vineyards.deerPlanner.invitation.outbound;

import com.vineyards.deerPlanner.invitation.application.port.InvitationTemplateRepository;
import com.vineyards.deerPlanner.invitation.domain.InvitationTemplate;
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
public class InvitationTemplateRepositoryAdapter implements InvitationTemplateRepository {

    private final InvitationTemplateJpaRepository jpa;

    @Override
    public List<InvitationTemplate> findByEventType(String eventType, boolean onlyActive) {
        List<InvitationTemplateEntity> rows = onlyActive
            ? jpa.findByEventTypeAndActiveOrderByDisplayOrderAsc(eventType, true)
            : jpa.findByEventTypeOrderByDisplayOrderAsc(eventType);
        return rows.stream().map(InvitationTemplateRepositoryAdapter::toDomain).toList();
    }

    @Override
    public Optional<InvitationTemplate> findById(String id) {
        return jpa.findById(id).map(InvitationTemplateRepositoryAdapter::toDomain);
    }

    @Override
    public InvitationTemplate save(InvitationTemplate template) {
        return toDomain(jpa.save(toEntity(template)));
    }

    static InvitationTemplate toDomain(InvitationTemplateEntity e) {
        return new InvitationTemplate(
            e.getId(), e.getCode(), e.getEventType(), e.getName(),
            e.getDescription(), e.isActive(), e.getDisplayOrder(),
            e.getCreatedAt(), e.getUpdatedAt()
        );
    }

    static InvitationTemplateEntity toEntity(InvitationTemplate d) {
        InvitationTemplateEntity e = new InvitationTemplateEntity();
        e.setId(d.id());
        e.setCode(d.code());
        e.setEventType(d.eventType());
        e.setName(d.name());
        e.setDescription(d.description());
        e.setActive(d.active());
        e.setDisplayOrder(d.displayOrder());
        e.setCreatedAt(d.createdAt());
        e.setUpdatedAt(d.updatedAt());
        return e;
    }
}
