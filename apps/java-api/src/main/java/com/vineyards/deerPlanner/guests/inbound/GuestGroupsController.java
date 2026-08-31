package com.vineyards.deerPlanner.guests.inbound;

import com.vineyards.deerPlanner.guests.facade.GuestFacade;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestGroupDto;
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestGroupsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestGroupDto;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping(path = "/api/v1/events/{eventId}/guest-groups")
@PrimaryAdapter
@PreAuthorize("hasAnyRole('EventOrganizer', 'Administrator')")
@RequiredArgsConstructor
@Slf4j
public class GuestGroupsController {

  private final GuestFacade guestApi;

  @GetMapping
  public ListGuestGroupsResponse list(
      @PathVariable String eventId, @AuthenticationPrincipal Jwt jwt) {
    return guestApi.listGroups(eventId, jwt.getSubject());
  }

  @GetMapping("/{groupId}")
  public GuestGroupDto get(
      @PathVariable String eventId,
      @PathVariable String groupId,
      @AuthenticationPrincipal Jwt jwt) {
    return guestApi.getGroup(groupId, jwt.getSubject());
  }

  @PostMapping
  public ResponseEntity<GuestGroupDto> create(
      @PathVariable String eventId,
      @Valid @RequestBody CreateGuestGroupDto body,
      @AuthenticationPrincipal Jwt jwt) {
    GuestGroupDto created = guestApi.createGroup(eventId, body, jwt.getSubject());
    URI location =
        ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(created.id())
            .toUri();
    return ResponseEntity.created(location).body(created);
  }

  @PatchMapping(path = "/{groupId}")
  public GuestGroupDto update(
      @PathVariable String eventId,
      @PathVariable String groupId,
      @Valid @RequestBody UpdateGuestGroupDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return guestApi.updateGroup(groupId, body, jwt.getSubject());
  }

  @DeleteMapping("/{groupId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(
      @PathVariable String eventId,
      @PathVariable String groupId,
      @AuthenticationPrincipal Jwt jwt) {
    guestApi.deleteGroup(groupId, jwt.getSubject());
  }

  @PostMapping("/{groupId}/regenerate-token")
  public GuestGroupDto regenerateToken(
      @PathVariable String eventId,
      @PathVariable String groupId,
      @AuthenticationPrincipal Jwt jwt) {
    return guestApi.regenerateGroupToken(groupId, jwt.getSubject());
  }
}
