package com.vineyards.deerPlanner.identity.facade;

public record AuthenticateRequest(String grantType, String username, String password) {}
