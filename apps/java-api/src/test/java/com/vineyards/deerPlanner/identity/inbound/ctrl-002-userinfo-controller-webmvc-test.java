package com.vineyards.deerPlanner.identity.inbound;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.facade.IdentityApi;
import com.vineyards.deerPlanner.identity.facade.UserProfileResponse;
import com.vineyards.deerPlanner.shared.exceptions.UserNotFoundException;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import jakarta.servlet.FilterChain;
import java.time.OffsetDateTime;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

@ExtendWith(SpringExtension.class)
@WebMvcTest(UserInfoController.class)
@AutoConfigureMockMvc
class Ctrl002UserInfoControllerSliceTest {

  @Autowired MockMvc mvc;

  @MockitoBean IdentityApi identityApi;

  // The shared JwtAuthenticationFilter is on the classpath and Spring Boot registers it
  // in the FilterChain during a web slice. Replace it with a Mockito bean that delegates
  // straight to the next filter — that way the SecurityContext populated by the
  // spring-security-test jwt() post-processor reaches the controller untouched.
  @MockitoBean JwtAuthenticationFilter jwtAuthenticationFilter;

  @BeforeEach
  void passThroughJwtFilter() throws Exception {
    doAnswer(
            inv -> {
              FilterChain chain = inv.getArgument(2);
              chain.doFilter(inv.getArgument(0), inv.getArgument(1));
              return null;
            })
        .when(jwtAuthenticationFilter)
        .doFilter(any(), any(), any());
  }

  @Test
  void getUserinfo_returns200WithProfile_whenJwtIsValid() throws Exception {
    when(identityApi.getProfile("user-1"))
        .thenReturn(
            new UserProfileResponse(
                "user-1",
                "alice",
                "Alice Doe",
                "alice@example.com",
                Set.of(Role.EventOrganizer),
                OffsetDateTime.parse("2026-08-15T10:30:00Z")));

    mvc.perform(get("/oauth/userinfo").with(jwt().jwt(j -> j.subject("user-1"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("user-1"))
        .andExpect(jsonPath("$.username").value("alice"))
        .andExpect(jsonPath("$.displayName").value("Alice Doe"))
        .andExpect(jsonPath("$.email").value("alice@example.com"))
        .andExpect(jsonPath("$.roles[0]").value("EventOrganizer"));
  }

  @Test
  void getUserinfo_returns404_whenUserNotFound() throws Exception {
    when(identityApi.getProfile("missing-user"))
        .thenThrow(new UserNotFoundException("missing-user"));

    mvc.perform(get("/oauth/userinfo").with(jwt().jwt(j -> j.subject("missing-user"))))
        .andExpect(status().isNotFound());
  }
}
