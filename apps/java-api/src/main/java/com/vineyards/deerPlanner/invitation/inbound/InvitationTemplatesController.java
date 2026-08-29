package com.vineyards.deerPlanner.invitation.inbound;

import com.vineyards.deerPlanner.invitation.facade.InvitationTemplateFacade;
import com.vineyards.deerPlanner.invitation.facade.dto.ListInvitationTemplatesResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/invitation-templates", produces = MediaType.APPLICATION_JSON_VALUE)
@PrimaryAdapter
@PreAuthorize("hasAnyRole('EventOrganizer', 'Administrator')")
@RequiredArgsConstructor
@Slf4j
public class InvitationTemplatesController {

  private final InvitationTemplateFacade templateApi;

  @GetMapping
  public ListInvitationTemplatesResponse list(
      @RequestParam("eventType") String eventType,
      @RequestParam(value = "onlyActive", defaultValue = "true") boolean onlyActive) {
    return templateApi.listByEventType(eventType, onlyActive);
  }

  @GetMapping("/{templateId}")
  public Object get(@PathVariable String templateId) {
    return templateApi
        .findById(templateId)
        .orElseThrow(
            () ->
                new com.vineyards.deerPlanner.shared.exceptions.BusinessError(
                    "template_not_found", "Template " + templateId + " not found"));
  }
}
