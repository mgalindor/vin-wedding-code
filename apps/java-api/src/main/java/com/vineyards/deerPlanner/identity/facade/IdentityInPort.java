package com.vineyards.deerPlanner.identity.facade;

import org.jmolecules.architecture.hexagonal.PrimaryPort;

@PrimaryPort
public interface IdentityInPort {

  AuthenticateResponse authenticate(String username, String password);

  UserProfileResponse getProfile(String userId);
}
