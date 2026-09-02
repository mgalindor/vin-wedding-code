package com.vineyards.deerPlanner.identity.facade;

import com.vineyards.deerPlanner.identity.facade.dto.CreateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UpdateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UserResponse;
import com.vineyards.deerPlanner.shared.web.PagedResponse;
import org.jmolecules.architecture.hexagonal.PrimaryPort;
import org.springframework.data.domain.Pageable;

/**
 * Primary port for user CRUD operations (create, edit, disable, enable, list, read). Distinct from
 * {@link IdentityInPort} which handles the auth flow (login, refresh, self profile).
 */
@PrimaryPort
public interface UserInPort {

  UserResponse createUser(CreateUserDto dto, String actorUserId);

  UserResponse updateUser(
      String userId, UpdateUserDto dto, String actorUserId, boolean actorIsAdmin);

  UserResponse getUser(String userId, String actorUserId, boolean actorIsAdmin);

  /**
   * Paginated admin listing. {@code q} is a case-insensitive substring match against username,
   * displayName or email. {@code role} is an exact match on the role name. {@code isActive} filters
   * active vs disabled rows. Null / blank filters are ignored.
   */
  PagedResponse<UserResponse> listUsers(String q, String role, Boolean isActive, Pageable pageable);

  void disableUser(String userId, String actorUserId);

  void enableUser(String userId, String actorUserId);

  /**
   * Soft-deletes a user. Hibernate {@code @SoftDelete} translates the row delete into an update of
   * the {@code deleted} column, and the global {@code @SQLRestriction} removes the row from every
   * subsequent query — the user effectively disappears from the API. Admin-only.
   */
  void deleteUser(String userId, String actorUserId);
}
