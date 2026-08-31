package com.vineyards.deerPlanner.shared.web;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vineyards.deerPlanner.shared.security.JwksController;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticatorInPort;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(JwksController.class)
@AutoConfigureMockMvc(addFilters = false)
class JwksControllerTest {

  private static final String SAMPLE_JWKS_JSON =
      """
      {
        "keys": [
          {
            "kty": "RSA",
            "kid": "deer-planner-key-1",
            "use": "sig",
            "alg": "RS256",
            "n": "abcd1234",
            "e": "AQAB"
          }
        ]
      }
      """;

  @Autowired MockMvc mvc;

  @MockitoBean JwtAuthenticatorInPort jwtAuthenticator;

  @Test
  void jwks_whenCalled_returnsPublicJwksDocument() throws Exception {
    when(jwtAuthenticator.getJwksJson()).thenReturn(SAMPLE_JWKS_JSON);

    mvc.perform(get("/.well-known/jwks.json"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith("application/json"))
        .andExpect(header().string("Cache-Control", "max-age=300, public"))
        .andExpect(jsonPath("$.keys[0].kid").value("deer-planner-key-1"))
        .andExpect(jsonPath("$.keys[0].alg").value("RS256"))
        .andExpect(jsonPath("$.keys[0].kty").value("RSA"));
  }

  @Test
  void jwks_whenCalled_doesNotLeakPrivateKeyMaterial() throws Exception {
    when(jwtAuthenticator.getJwksJson()).thenReturn(SAMPLE_JWKS_JSON);

    // The JWKS endpoint must never include private key fields. We assert that the
    // response does not contain the typical "d" or "p" / "q" parameters used by
    // private RSA keys.
    mvc.perform(get("/.well-known/jwks.json"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.keys[0].d").doesNotExist())
        .andExpect(jsonPath("$.keys[0].p").doesNotExist())
        .andExpect(jsonPath("$.keys[0].q").doesNotExist());
  }
}
