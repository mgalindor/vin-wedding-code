package com.vineyards.deerPlanner.identity.inbound;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.facade.UserInPort;
import com.vineyards.deerPlanner.identity.facade.dto.CreateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UpdateUserDto;
import com.vineyards.deerPlanner.identity.facade.dto.UserResponse;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import com.vineyards.deerPlanner.shared.security.JwtAuthenticatorInPort;
import jakarta.servlet.FilterChain;
import java.time.Instant;
import java.util.EnumSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc
class UserControllerTest {

  @Autowired MockMvc mvc;

  @MockitoBean UserInPort userApi;

  @MockitoBean JwtAuthenticatorInPort jwtAuthenticator;

  /**
   * The shared JwtAuthenticationFilter is on the classpath and Spring picks it up during the web
   * slice. Bypass it so the SecurityContext populated by {@code jwt()} reaches the controller
   * untouched.
   */
  @MockitoBean JwtAuthenticationFilter jwtFilter;

  @BeforeEach
  void passThroughJwtFilter() throws Exception {
    org.mockito.Mockito.doAnswer(
            inv -> {
              FilterChain chain = inv.getArgument(2);
              chain.doFilter(inv.getArgument(0), inv.getArgument(1));
              return null;
            })
        .when(jwtFilter)
        .doFilter(any(), any(), any());
  }

  private static UserResponse sample(String id, String username) {
    return new UserResponse(
        id,
        username,
        "Display " + username,
        username + "@example.com",
        null,
        true,
        EnumSet.of(Role.EventOrganizer),
        null,
        Instant.parse("2026-08-01T09:00:00Z"),
        Instant.parse("2026-08-01T09:00:00Z"));
  }

  // ---------- POST /api/v1/users ----------

  @Test
  void createUser_whenValid_returns201AndLocation() throws Exception {
    when(userApi.createUser(any(CreateUserDto.class), any()))
        .thenReturn(sample("new-id", "miguel@deer"));

    mvc.perform(
            post("/api/v1/users")
                .with(jwt().jwt(j -> j.subject("admin-id")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "username": "miguel",
                      "displayName": "Miguel Doe",
                      "email": "miguel@example.com",
                      "password": "hunter2hunter",
                      "roles": ["EventOrganizer"]
                    }
                    """))
        .andExpect(status().isCreated())
        .andExpect(header().string("Location", "/api/v1/users/new-id"))
        .andExpect(jsonPath("$.id").value("new-id"))
        .andExpect(jsonPath("$.username").value("miguel@deer"))
        .andExpect(jsonPath("$.roles[0]").value("EventOrganizer"));
  }

  @Test
  void createUser_whenUsernameBlank_returns400() throws Exception {
    mvc.perform(
            post("/api/v1/users")
                .with(jwt().jwt(j -> j.subject("admin-id")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "username": "",
                      "displayName": "X",
                      "password": "hunter2hunter",
                      "roles": ["EventOrganizer"]
                    }
                    """))
        .andExpect(status().isBadRequest());

    verify(userApi, org.mockito.Mockito.never()).createUser(any(), any());
  }

  @Test
  void createUser_whenRolesEmpty_returns400() throws Exception {
    mvc.perform(
            post("/api/v1/users")
                .with(jwt().jwt(j -> j.subject("admin-id")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "username": "miguel",
                      "displayName": "Miguel",
                      "password": "hunter2hunter",
                      "roles": []
                    }
                    """))
        .andExpect(status().isBadRequest());

    verify(userApi, org.mockito.Mockito.never()).createUser(any(), any());
  }

  @Test
  void createUser_whenPasswordTooShort_returns400() throws Exception {
    mvc.perform(
            post("/api/v1/users")
                .with(jwt().jwt(j -> j.subject("admin-id")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "username": "miguel",
                      "displayName": "Miguel",
                      "password": "short",
                      "roles": ["EventOrganizer"]
                    }
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void createUser_whenEmailMalformed_returns400() throws Exception {
    mvc.perform(
            post("/api/v1/users")
                .with(jwt().jwt(j -> j.subject("admin-id")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "username": "miguel",
                      "displayName": "Miguel",
                      "email": "not-an-email",
                      "password": "hunter2hunter",
                      "roles": ["EventOrganizer"]
                    }
                    """))
        .andExpect(status().isBadRequest());
  }

  // ---------- PATCH /api/v1/users/{id} ----------

  @Test
  void updateUser_returns200WithUpdatedUser() throws Exception {
    when(userApi.updateUser(eq("user-id"), any(UpdateUserDto.class), any(), eq(false)))
        .thenReturn(sample("user-id", "alice@deer"));

    mvc.perform(
            patch("/api/v1/users/user-id")
                .with(jwt().jwt(j -> j.subject("user-id")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"displayName": "New Name"}
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("user-id"))
        .andExpect(jsonPath("$.username").value("alice@deer"));
  }

  // ---------- POST /api/v1/users/{id}/disable ----------

  @Test
  void disableUser_returns204() throws Exception {
    mvc.perform(post("/api/v1/users/user-id/disable").with(jwt().jwt(j -> j.subject("admin-id"))))
        .andExpect(status().isNoContent());

    verify(userApi).disableUser(eq("user-id"), any());
  }

  // ---------- POST /api/v1/users/{id}/enable ----------

  @Test
  void enableUser_returns204() throws Exception {
    mvc.perform(post("/api/v1/users/user-id/enable").with(jwt().jwt(j -> j.subject("admin-id"))))
        .andExpect(status().isNoContent());

    verify(userApi).enableUser(eq("user-id"), any());
  }
}
