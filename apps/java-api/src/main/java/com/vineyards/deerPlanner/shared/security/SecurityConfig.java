package com.vineyards.deerPlanner.shared.security;

import jakarta.servlet.http.HttpServletResponse;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.json.JsonMapper;

/**
 * Stateless JWT security: only the routes opted out in the matcher list are public; everything else
 * requires a valid bearer token. 401/403 responses follow the {@code { code, message, timestamp }}
 * envelope.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final JsonMapper jsonMapper;

  public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, JsonMapper jsonMapper) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    this.jsonMapper = jsonMapper;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
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
                                HttpServletResponse.SC_UNAUTHORIZED,
                                "unauthorized",
                                "Authentication is required to access this resource"))
                    .accessDeniedHandler(
                        (request, response, accessDeniedException) ->
                            writeError(
                                response,
                                HttpServletResponse.SC_FORBIDDEN,
                                "forbidden",
                                "You do not have permission to access this resource")))
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  private void writeError(HttpServletResponse response, int status, String code, String message) {
    try {
      response.setStatus(status);
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);

      Map<String, Object> body = new LinkedHashMap<>();
      body.put("code", code);
      body.put("message", message);
      body.put("timestamp", OffsetDateTime.now().toString());

      response.getWriter().write(jsonMapper.writeValueAsString(body));
    } catch (Exception ignored) {
      // Best-effort: if writing the body fails, the response status is already set.
    }
  }
}
