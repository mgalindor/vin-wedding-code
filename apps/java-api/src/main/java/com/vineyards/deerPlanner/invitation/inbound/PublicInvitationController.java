package com.vineyards.deerPlanner.invitation.inbound;

import com.vineyards.deerPlanner.invitation.facade.PublicInvitationInPort;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicInvitationDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpRequestDto;
import com.vineyards.deerPlanner.invitation.facade.dto.PublicRsvpResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public invitation surface. No JWT â€” the {@code slug} IS the access token. The {@code
 * PublicTokenFilter} (in {@code shared/security/}) already validated the slug and stored the
 * resolved {@code eventId} in the request attributes if needed; this controller reads the slug path
 * variable directly and delegates validation to {@link
 * com.vineyards.deerPlanner.invitation.application.PublicInvitationService}.
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

  @PostMapping(path = "/{slug}/rsvp")
  public PublicRsvpResponseDto submitRsvp(
      @PathVariable String slug, @Valid @RequestBody PublicRsvpRequestDto body) {
    return publicInvitationApi.submitRsvp(slug, body);
  }
}
