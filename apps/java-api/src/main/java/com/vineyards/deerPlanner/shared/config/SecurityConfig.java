package com.vineyards.deerPlanner.shared.config;

import com.vineyards.deerPlanner.shared.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.json.JsonMapper;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  /** BCrypt cost factor used everywhere a password is hashed. Keep a single source of truth. */
  private static final int BCRYPT_STRENGTH = 12;

  /**
   * Single {@link PasswordEncoder} bean shared by every component that hashes or verifies passwords
   * (authenticate flow, identity bootstrap). Cost factor 12 per ADR-05.
   */
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(BCRYPT_STRENGTH);
  }

  /**
   * Per-IP rate limiter for the public auth endpoints. Default 10 requests per minute per key. Bump
   * up for tests by overriding the bean.
   */
  @Bean
  public com.vineyards.deerPlanner.shared.security.TokenBucketRateLimiter tokenBucketRateLimiter() {
    return new com.vineyards.deerPlanner.shared.security.TokenBucketRateLimiter(10);
  }

  /**
   * The application's single SecurityFilterChain. {@code @Order(HIGHEST_PRECEDENCE)} + {@code
   * securityMatcher("/**)} make sure no other chain (notably Spring Boot's default or any
   * autoconfigured one from {@code spring-boot-starter-oauth2-resource-server}) can shadow this one
   * with a default form-login page. The starter stays in the classpath only because it pulls in the
   * JOSE / Nimbus dependencies we use to issue our own JWTs — we do NOT rely on its auto-configured
   * filter chain.
   */
  @Bean
  @Order(Ordered.HIGHEST_PRECEDENCE)
  public SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      JwtAuthenticationFilter jwtAuthenticationFilter,
      com.vineyards.deerPlanner.shared.security.TokenRateLimitFilter tokenRateLimitFilter,
      JsonMapper jsonMapper)
      throws Exception {
    http.securityMatcher("/**")
        .csrf(AbstractHttpConfigurer::disable)
        .cors(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable)
        .anonymous(AbstractHttpConfigurer::disable)
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            authorize ->
                authorize
                    .requestMatchers("/oauth/token", "/oauth/refresh", "/oauth/userinfo")
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
        .addFilterBefore(tokenRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
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
