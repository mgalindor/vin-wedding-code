package com.vineyards.deerPlanner.identity.facade;

public record AuthenticateResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    String refreshToken,
    long refreshExpiresIn
) {
    public static AuthenticateResponse bearer(
        String accessToken,
        long expiresIn,
        String refreshToken,
        long refreshExpiresIn
    ) {
        return new AuthenticateResponse(accessToken, "Bearer", expiresIn, refreshToken, refreshExpiresIn);
    }
}
