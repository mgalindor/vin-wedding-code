package com.vineyards.deerPlanner.invitation.outbound;

import com.vineyards.deerPlanner.invitation.application.port.InvitationTemplateOutPort;
import com.vineyards.deerPlanner.invitation.domain.InvitationTemplate;
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
public class InvitationTemplateRepositoryAdapter implements InvitationTemplateOutPort {

  private final InvitationTemplateJpaRepository jpa;

  @Override
  public List<InvitationTemplate> findByEventType(String eventType, boolean onlyActive) {
    List<InvitationTemplateEntity> rows =
        onlyActive
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
    return InvitationTemplate.builder()
        .id(e.getId())
        .code(e.getCode())
        .eventType(e.getEventType())
        .name(e.getName())
        .description(e.getDescription())
        .active(e.isActive())
        .displayOrder(e.getDisplayOrder())
        .createdAt(e.getCreatedAt())
        .updatedAt(e.getUpdatedAt())
        .build();
  }

  static InvitationTemplateEntity toEntity(InvitationTemplate d) {
    InvitationTemplateEntity e = new InvitationTemplateEntity();
    e.setId(d.getId());
    e.setCode(d.getCode());
    e.setEventType(d.getEventType());
    e.setName(d.getName());
    e.setDescription(d.getDescription());
    e.setActive(d.isActive());
    e.setDisplayOrder(d.getDisplayOrder());
    e.setCreatedAt(d.getCreatedAt());
    e.setUpdatedAt(d.getUpdatedAt());
    return e;
  }
}
