package com.vineyards.deerPlanner.identity.facade;

import org.jmolecules.architecture.hexagonal.PrimaryPort;

@PrimaryPort
public interface IdentityApi {

    AuthenticateResponse authenticate(String username, String password);

    UserProfileResponse getProfile(String userId);
}
