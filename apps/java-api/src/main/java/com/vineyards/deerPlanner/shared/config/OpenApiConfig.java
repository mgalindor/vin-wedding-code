package com.vineyards.deerPlanner.shared.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Centralised OpenAPI metadata. Declares the JWT bearer security scheme once so every protected
 * controller (via {@code @SecurityRequirement(name = "bearerAuth")}) shares the same definition in
 * the generated {@code /v3/api-docs}.
 *
 * <p>The frontend client generator picks up the scheme and adds the bearer header to every
 * authenticated request without manual wiring per call.
 */
@Configuration
@OpenAPIDefinition(
    info =
        @Info(
            title = "Deer Planner API",
            version = "1.0.0",
            description =
                "Wedding & event planning backend. Two roles (Administrator, EventOrganizer); "
                    + "JWT bearer auth with refresh-token rotation; modular monolith (events, "
                    + "guests, invitation, identity).",
            contact = @Contact(name = "Deer Planner Team"),
            license = @License(name = "Proprietary")),
    servers = {@Server(url = "/", description = "Same origin")})
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "Paste the accessToken returned by /oauth/token or /oauth/refresh.")
public class OpenApiConfig {}
