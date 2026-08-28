package com.vineyards.deerPlanner.identity.inbound;

import com.vineyards.deerPlanner.identity.facade.AuthenticateResponse;
import com.vineyards.deerPlanner.identity.facade.IdentityApi;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/oauth", produces = MediaType.APPLICATION_JSON_VALUE)
@PrimaryAdapter
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final IdentityApi identityApi;

    @PostMapping(path = "/token", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthenticateResponse> token(@Valid @RequestBody TokenBody body) {
        AuthenticateResponse response = identityApi.authenticate(body.username(), body.password());
        return ResponseEntity.ok(response);
    }

    public record TokenBody(
        @NotBlank(message = "Only grant_type=password is supported")
        String grantType,

        @NotBlank(message = "Username is required")
        String username,

        @NotBlank(message = "Password is required")
        String password
    ) {
    }
}
