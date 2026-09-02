package com.vineyards.deerPlanner.invitation.inbound;

import com.vineyards.deerPlanner.invitation.facade.EventInvitationConfigInPort;
import com.vineyards.deerPlanner.invitation.facade.dto.EventInvitationConfigDto;
import com.vineyards.deerPlanner.invitation.facade.dto.UpdateInvitationConfigDto;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/events/{eventId}/invitation-config")
@PrimaryAdapter
@PreAuthorize("hasAnyRole('EventOrganizer', 'Administrator')")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
public class EventInvitationConfigController {

  private final EventInvitationConfigInPort configApi;

  @GetMapping
  public EventInvitationConfigDto get(
      @PathVariable String eventId, @AuthenticationPrincipal Jwt jwt) {
    return configApi.getInvitationConfig(eventId, jwt.getSubject());
  }

  @PutMapping
  public EventInvitationConfigDto update(
      @PathVariable String eventId,
      @Valid @RequestBody UpdateInvitationConfigDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return configApi.updateInvitationConfig(eventId, body, jwt.getSubject());
  }
}
