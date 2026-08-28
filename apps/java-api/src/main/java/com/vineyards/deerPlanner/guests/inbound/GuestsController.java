package com.vineyards.deerPlanner.guests.inbound;

import com.vineyards.deerPlanner.guests.facade.GuestApi;
import com.vineyards.deerPlanner.guests.facade.dto.CreateGuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.GuestDto;
import com.vineyards.deerPlanner.guests.facade.dto.ListGuestsResponse;
import com.vineyards.deerPlanner.guests.facade.dto.UpdateGuestDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import java.net.URI;

@RestController
@RequestMapping(path = "/api/v1/events/{eventId}/guests", produces = MediaType.APPLICATION_JSON_VALUE)
@PrimaryAdapter
@PreAuthorize("hasAnyRole('EventOrganizer', 'Administrator')")
@RequiredArgsConstructor
@Slf4j
public class GuestsController {

    private final GuestApi guestApi;

    @GetMapping
    public ListGuestsResponse list(
        @PathVariable String eventId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return guestApi.listGuests(eventId, jwt.getSubject());
    }

    @GetMapping("/{guestId}")
    public GuestDto get(
        @PathVariable String eventId,
        @PathVariable String guestId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return guestApi.getGuest(guestId, jwt.getSubject());
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GuestDto> create(
        @PathVariable String eventId,
        @Valid @RequestBody CreateGuestDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        GuestDto created = guestApi.createGuest(eventId, body, jwt.getSubject());
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(created.id())
            .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PatchMapping(path = "/{guestId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public GuestDto update(
        @PathVariable String eventId,
        @PathVariable String guestId,
        @Valid @RequestBody UpdateGuestDto body,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return guestApi.updateGuest(guestId, body, jwt.getSubject());
    }

    @DeleteMapping("/{guestId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
        @PathVariable String eventId,
        @PathVariable String guestId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        guestApi.deleteGuest(guestId, jwt.getSubject());
    }
}
