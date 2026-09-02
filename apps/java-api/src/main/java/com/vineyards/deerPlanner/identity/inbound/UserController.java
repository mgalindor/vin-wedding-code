package com.vineyards.deerPlanner.identity.inbound;

import com.vineyards.deerPlanner.identity.facade.UserInPort;
import com.vineyards.deerPlanner.identity.facade.dto.CreateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UpdateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UserResponse;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * User-management endpoints. Authorization matrix:
 *
 * <ul>
 *   <li>{@code POST /} — admin only (creates new users)
 *   <li>{@code GET /} — admin only (list all users)
 *   <li>{@code GET /{id}} — admin or owner
 *   <li>{@code PATCH /{id}} — admin or owner (admins may also change roles)
 *   <li>{@code POST /{id}/disable} — admin only
 *   <li>{@code POST /{id}/enable} — admin only
 * </ul>
 */
@Slf4j
@RestController
@PrimaryAdapter
@RequiredArgsConstructor
@RequestMapping(path = "/api/v1/users")
public class UserController {

  private static final String ADMIN = "Administrator";

  private final UserInPort userApi;

  @PostMapping
  @PreAuthorize("hasRole('Administrator')")
  public ResponseEntity<UserResponse> createUser(
      @Valid @RequestBody CreateUserDto body, @AuthenticationPrincipal Jwt jwt) {
    UserResponse created = userApi.createUser(body, jwt.getSubject());
    URI location = URI.create("/api/v1/users/" + created.id());
    return ResponseEntity.created(location).body(created);
  }

  @GetMapping
  @PreAuthorize("hasRole('Administrator')")
  public PagedResponse<UserResponse> listUsers(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String role,
      @RequestParam(required = false) Boolean isActive,
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
          Pageable pageable) {
    return userApi.listUsers(q, role, isActive, pageable);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasRole('Administrator') or #id == authentication.name")
  public UserResponse getUser(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
    return userApi.getUser(id, jwt.getSubject(), isAdmin(jwt));
  }

  @PatchMapping("/{id}")
  @PreAuthorize("hasRole('Administrator') or #id == authentication.name")
  public UserResponse updateUser(
      @PathVariable String id,
      @Valid @RequestBody UpdateUserDto body,
      @AuthenticationPrincipal Jwt jwt) {
    return userApi.updateUser(id, body, jwt.getSubject(), isAdmin(jwt));
  }

  @PostMapping("/{id}/disable")
  @PreAuthorize("hasRole('Administrator')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void disableUser(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
    userApi.disableUser(id, jwt.getSubject());
  }

  @PostMapping("/{id}/enable")
  @PreAuthorize("hasRole('Administrator')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void enableUser(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
    userApi.enableUser(id, jwt.getSubject());
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('Administrator')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteUser(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
    userApi.deleteUser(id, jwt.getSubject());
  }

  private static boolean isAdmin(Jwt jwt) {
    List<String> roles = jwt.getClaimAsStringList("roles");
    return roles != null && roles.contains(ADMIN);
  }
}
