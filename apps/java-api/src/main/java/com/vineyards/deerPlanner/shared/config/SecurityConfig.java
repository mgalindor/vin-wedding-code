package com.vineyards.deerPlanner.shared.config;

import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.json.JsonMapper;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  public SecurityFilterChain securityFilterChain(
      HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter, JsonMapper jsonMapper)
      throws Exception {
    http.csrf(AbstractHttpConfigurer::disable)
        .cors(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            authorize ->
                authorize
                    .requestMatchers("/oauth/token")
                    .permitAll()
                    .requestMatchers("/.well-known/**")
                    .permitAll()
                    .requestMatchers("/api/v1/public/**")
                    .permitAll()
                    .requestMatchers("/actuator/health/**")
                    .permitAll()
                    .requestMatchers("/actuator/info")
                    .permitAll()
                    .requestMatchers("/v3/api-docs/**")
                    .permitAll()
                    .requestMatchers("/swagger-ui/**")
                    .permitAll()
                    .requestMatchers("/swagger-ui.html")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            handler ->
                handler
                    .authenticationEntryPoint(
                        (request, response, authException) ->
                            writeError(
                                response,
                                jsonMapper,
                                HttpServletResponse.SC_UNAUTHORIZED,
                                "Unauthorized",
                                "Authentication is required to access this resource"))
                    .accessDeniedHandler(
                        (request, response, accessDeniedException) ->
                            writeError(
                                response,
                                jsonMapper,
                                HttpServletResponse.SC_FORBIDDEN,
                                "Forbidden",
                                "You do not have permission to access this resource")))
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  private void writeError(
      HttpServletResponse response,
      JsonMapper jsonMapper,
      int status,
      String title,
      String detail) {
    try {
      response.setStatus(status);
      response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);

      Map<String, Object> body = new LinkedHashMap<>();
      body.put("type", "about:blank");
      body.put("title", title);
      body.put("status", status);
      body.put("detail", detail);

      response.getWriter().write(jsonMapper.writeValueAsString(body));
    } catch (Exception ignored) {
      // Best-effort: if writing the body fails, the response status is already set.
    }
  }
}
