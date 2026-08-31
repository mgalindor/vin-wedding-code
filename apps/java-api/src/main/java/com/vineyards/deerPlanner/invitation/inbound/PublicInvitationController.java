package com.vineyards.deerPlanner.invitation.inbound;

import com.vineyards.deerPlanner.invitation.facade.PublicInvitationInPort;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicGroupRsvpRequestDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicGroupViewDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicInvitationDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public invitation surface. No JWT — the {@code slug} + {@code groupToken} are the access tokens.
 * Event-level reads (the landing page) use the slug; group-level reads and writes (the RSVP page)
 * use both.
 */
@RestController
@RequestMapping(path = "/api/v1/public/invitations")
@PrimaryAdapter
@RequiredArgsConstructor
@Slf4j
public class PublicInvitationController {

  private final PublicInvitationInPort publicInvitationApi;

  @GetMapping("/{slug}")
  public PublicInvitationDto getBySlug(@PathVariable String slug) {
    return publicInvitationApi.getBySlug(slug);
  }

  @GetMapping("/{slug}/groups/{groupToken}")
  public PublicGroupViewDto getGroup(@PathVariable String slug, @PathVariable String groupToken) {
    return publicInvitationApi.getGroup(slug, groupToken);
  }

  @PutMapping(path = "/{slug}/groups/{groupToken}/rsvp")
  public PublicGroupViewDto submitRsvp(
      @PathVariable String slug,
      @PathVariable String groupToken,
      @Valid @RequestBody PublicGroupRsvpRequestDto body) {
    return publicInvitationApi.submitGroupRsvp(slug, groupToken, body);
  }
}
