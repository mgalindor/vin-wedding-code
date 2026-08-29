package com.vineyards.deerPlanner.identity.inbound;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vineyards.deerPlanner.identity.facade.AuthenticateResponse;
import com.vineyards.deerPlanner.identity.facade.IdentityApi;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class Ctrl001AuthControllerSliceTest {

  @Autowired MockMvc mvc;

  @MockitoBean IdentityApi identityApi;

  // The shared JwtAuthenticationFilter is on the classpath and Spring picks it up during
  // the web slice; supply a no-op JwtAuthenticator so the filter's @RequiredArgsConstructor
  // can resolve its only dependency.
  @MockitoBean JwtAuthenticator jwtAuthenticator;

  @Test
  void postToken_returns200WithBearerTokens_whenCredentialsValid() throws Exception {
    when(identityApi.authenticate(eq("alice"), eq("hunter2")))
        .thenReturn(new AuthenticateResponse("access.jwt", "Bearer", 3600L, "refresh.jwt", 86400L));

    mvc.perform(
            post("/oauth/token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"grantType":"password","username":"alice","password":"hunter2"}
                    """))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.tokenType").value("Bearer"))
        .andExpect(jsonPath("$.accessToken").value("access.jwt"))
        .andExpect(jsonPath("$.refreshToken").value("refresh.jwt"))
        .andExpect(jsonPath("$.expiresIn").value(3600));

    verify(identityApi).authenticate("alice", "hunter2");
  }

  @Test
  void postToken_returns400_whenUsernameIsBlank() throws Exception {
    mvc.perform(
            post("/oauth/token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"grantType":"password","username":"","password":"hunter2"}
                    """))
        .andExpect(status().isBadRequest());

    verifyNoInteractions(identityApi);
  }

  @Test
  void postToken_returns400_whenPasswordIsBlank() throws Exception {
    mvc.perform(
            post("/oauth/token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"grantType":"password","username":"alice","password":""}
                    """))
        .andExpect(status().isBadRequest());

    verifyNoInteractions(identityApi);
  }

  @Test
  void postToken_returns400_whenGrantTypeIsMissing() throws Exception {
    mvc.perform(
            post("/oauth/token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"username":"alice","password":"hunter2"}
                    """))
        .andExpect(status().isBadRequest());

    verifyNoInteractions(identityApi);
  }

  @Test
  void postToken_returns415_whenContentTypeIsNotJson() throws Exception {
    mvc.perform(post("/oauth/token").contentType(MediaType.TEXT_PLAIN).content("not json"))
        .andExpect(status().isUnsupportedMediaType());

    verifyNoInteractions(identityApi);
  }

  @Test
  void postToken_returns400_whenJsonIsMalformed() throws Exception {
    mvc.perform(post("/oauth/token").contentType(MediaType.APPLICATION_JSON).content("{not-json}"))
        .andExpect(status().isBadRequest());

    verifyNoInteractions(identityApi);
  }

  @Test
  void postToken_doesNotReturnSensitiveClaimsInBody() throws Exception {
    when(identityApi.authenticate(eq("alice"), eq("hunter2")))
        .thenReturn(new AuthenticateResponse("access.jwt", "Bearer", 3600L, "refresh.jwt", 86400L));

    // The response must never include the password_hash or any PII beyond what the
    // AuthenticateResponse DTO declares. Asserting the exact shape enforces the contract.
    mvc.perform(
            post("/oauth/token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"grantType":"password","username":"alice","password":"hunter2"}
                    """))
        .andExpect(status().isOk())
        .andExpect(header().string("Content-Type", "application/json"))
        .andExpect(jsonPath("$.passwordHash").doesNotExist())
        .andExpect(jsonPath("$.email").doesNotExist())
        .andExpect(jsonPath("$.displayName").doesNotExist());
  }
}
