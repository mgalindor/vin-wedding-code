package com.vineyards.deerPlanner.shared.security;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import lombok.Getter;

/**
 * Lightweight in-memory token-bucket rate limiter. One bucket per key (typically client IP); each
 * bucket refills at {@code permitsPerMinute / 60} tokens per second up to a burst of {@code
 * permitsPerMinute}. Tokens are consumed on every call; a bucket that runs out rejects the next
 * caller until it refills.
 *
 * <p>This is intentionally simple — the goal is to blunt credential-stuffing on the auth endpoints
 * without pulling in a new dependency. For multi-instance deployments swap it for a Redis-backed
 * limiter; the public surface ({@link #tryConsume}) stays the same.
 *
 * <p>Not a Spring {@code @Component}: the bean is declared in {@code SecurityConfig} so
 * {@code @WebMvcTest} slices pick it up via the security configuration import.
 */
public class TokenBucketRateLimiter {

  private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();
  private final int permitsPerMinute;
  private final double refillPerNano;

  public TokenBucketRateLimiter() {
    this(10); // default: 10 requests per minute per key
  }

  public TokenBucketRateLimiter(int permitsPerMinute) {
    if (permitsPerMinute <= 0) {
      throw new IllegalArgumentException("permitsPerMinute must be positive");
    }
    this.permitsPerMinute = permitsPerMinute;
    this.refillPerNano = permitsPerMinute / 60.0 / 1_000_000_000.0;
  }

  /** Attempts to consume one token from {@code key}'s bucket. Returns true if allowed. */
  public boolean tryConsume(String key) {
    Bucket bucket = buckets.computeIfAbsent(key, k -> new Bucket(permitsPerMinute));
    return bucket.tryConsume(refillPerNano);
  }

  /** Drop buckets that have been idle longer than {@code idleThresholdMs} — exposed for tests. */
  void evictIdle(long idleThresholdMs) {
    long now = System.nanoTime();
    buckets
        .entrySet()
        .removeIf(e -> (now - e.getValue().lastRefillNs) > idleThresholdMs * 1_000_000L);
  }

  @Getter
  static final class Bucket {
    private final int capacity;
    private double tokens;
    private long lastRefillNs;
    private static final AtomicLong COUNT = new AtomicLong();

    Bucket(int capacity) {
      this.capacity = capacity;
      this.tokens = capacity;
      this.lastRefillNs = System.nanoTime();
    }

    synchronized boolean tryConsume(double refillPerNano) {
      long now = System.nanoTime();
      long elapsed = now - lastRefillNs;
      if (elapsed > 0) {
        tokens = Math.min(capacity, tokens + elapsed * refillPerNano);
        lastRefillNs = now;
      }
      if (tokens >= 1.0) {
        tokens -= 1.0;
        return true;
      }
      return false;
    }
  }
}
