package com.vineyards.deerPlanner.identity.facade;

import org.jmolecules.architecture.hexagonal.PrimaryPort;

@PrimaryPort
public interface IdentityInPort {

  AuthenticateResponse authenticate(String username, String password);

  AuthenticateResponse refresh(String refreshToken);

  UserProfileResponse getProfile(String userId);

  void changeOwnPassword(String userId, String currentPassword, String newPassword);
}
