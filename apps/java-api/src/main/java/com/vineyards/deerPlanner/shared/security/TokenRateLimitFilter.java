package com.vineyards.deerPlanner.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;

/**
 * Rate-limit the public auth endpoints ({@code POST /oauth/token} and {@code POST /oauth/refresh})
 * per client IP. The bucket is shared with {@link TokenBucketRateLimiter}.
 *
 * <p>Returns {@code 429 Too Many Requests} with a JSON Problem body when the bucket is empty. Other
 * endpoints pass through untouched.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TokenRateLimitFilter extends OncePerRequestFilter {

  private static final String TOKEN_PATH = "/oauth/token";
  private static final String REFRESH_PATH = "/oauth/refresh";

  private final TokenBucketRateLimiter rateLimiter;
  private final JsonMapper jsonMapper;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {

    String path = request.getRequestURI();
    if (!TOKEN_PATH.equals(path) && !REFRESH_PATH.equals(path)) {
      chain.doFilter(request, response);
      return;
    }

    String key = clientKey(request);
    if (rateLimiter.tryConsume(key)) {
      chain.doFilter(request, response);
      return;
    }

    log.warn("rate-limit.exceeded path={} key={}", path, key);
    writeRateLimitedResponse(response);
  }

  private static String clientKey(HttpServletRequest request) {
    // Honor common reverse-proxy headers first.
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      // First IP in the chain is the original client.
      int comma = forwarded.indexOf(',');
      return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
    }
    return request.getRemoteAddr();
  }

  private void writeRateLimitedResponse(HttpServletResponse response) throws IOException {
    response.setStatus(429);
    response.setHeader("Retry-After", "60");
    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);

    java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
    body.put("type", "about:blank");
    body.put("title", "Too Many Requests");
    body.put("status", 429);
    body.put("detail", "Rate limit exceeded. Try again in a minute.");
    response.getWriter().write(jsonMapper.writeValueAsString(body));
  }
}
