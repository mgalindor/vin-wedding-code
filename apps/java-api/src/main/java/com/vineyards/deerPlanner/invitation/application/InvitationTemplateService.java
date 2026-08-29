package com.vineyards.deerPlanner.invitation.application;

import com.vineyards.deerPlanner.invitation.application.port.InvitationTemplateRepository;
import com.vineyards.deerPlanner.invitation.domain.InvitationTemplate;
import com.vineyards.deerPlanner.invitation.facade.InvitationTemplateFacade;
import com.vineyards.deerPlanner.invitation.facade.dto.InvitationTemplateDto;
import com.vineyards.deerPlanner.invitation.facade.dto.ListInvitationTemplatesResponse;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.Application;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Application
@RequiredArgsConstructor
@Slf4j
public class InvitationTemplateService implements InvitationTemplateFacade {

  private final InvitationTemplateRepository repository;

  @Override
  @Transactional(readOnly = true)
  public ListInvitationTemplatesResponse listByEventType(String eventType, boolean onlyActive) {
    List<InvitationTemplate> templates = repository.findByEventType(eventType, onlyActive);
    List<InvitationTemplateDto> items =
        templates.stream().map(InvitationTemplateService::toDto).toList();
    return new ListInvitationTemplatesResponse(items, items.size());
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<InvitationTemplateDto> findById(String templateId) {
    return repository.findById(templateId).map(InvitationTemplateService::toDto);
  }

  static InvitationTemplateDto toDto(InvitationTemplate template) {
    return new InvitationTemplateDto(
        template.getId(),
        template.getCode(),
        template.getEventType(),
        template.getName(),
        template.getDescription(),
        template.getDisplayOrder(),
        template.getCreatedAt(),
        template.getUpdatedAt());
  }
}
