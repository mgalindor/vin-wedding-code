package com.vineyards.deerPlanner.identity.facade.dto;

import jakarta.validation.constraints.NotBlank;

/** Refresh-token grant. Currently the only supported grant_type is "refresh_token". */
public record RefreshTokenRequest(
    @NotBlank(message = "Only grant_type=refresh_token is supported") String grantType,
    @NotBlank(message = "refreshToken is required") String refreshToken) {}
