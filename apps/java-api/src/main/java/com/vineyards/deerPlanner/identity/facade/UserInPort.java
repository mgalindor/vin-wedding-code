package com.vineyards.deerPlanner.identity.facade;

import com.vineyards.deerPlanner.identity.facade.dto.CreateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UpdateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UserResponse;
import java.util.List;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

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

  List<UserResponse> listUsers();

  void disableUser(String userId, String actorUserId);

  void enableUser(String userId, String actorUserId);

  /**
   * Soft-deletes a user. Hibernate {@code @SoftDelete} translates the row delete into an update of
   * the {@code deleted} column, and the global {@code @SQLRestriction} removes the row from every
   * subsequent query — the user effectively disappears from the API. Admin-only.
   */
  void deleteUser(String userId, String actorUserId);
}
